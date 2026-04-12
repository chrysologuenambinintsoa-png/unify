import { v4 as uuidv4 } from 'uuid'
import formidable from 'formidable'
import { promises as fs } from 'fs'
import { v2 as cloudinary } from 'cloudinary'
import prisma from '../../lib/prisma'

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

export const config = {
  api: { bodyParser: false },
}

export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' })
    }

    // Parse form data
    const form = formidable({
      maxFileSize: 50 * 1024 * 1024, // 50 MB
      maxTotalFileSize: 100 * 1024 * 1024, // 100 MB total
      maxFields: 10,
      maxFieldNameSize: 100,
      maxFieldSize: 10 * 1024 * 1024 // 10 MB per field
    })
    const [fields, files] = await form.parse(req)

    const fileArray = files.image || files.file || files.files || []
    const type = fields.type?.[0]
    let userEmail = fields.userEmail?.[0]
    
    // Also check header for user email
    if (!userEmail && req.headers['x-user-email']) {
      userEmail = req.headers['x-user-email']
    }

    console.log('Upload request:', {
      filesCount: fileArray.length,
      type,
      userEmail,
      fileTypes: fileArray.map((f) => ({ name: f.originalFilename, type: f.mimetype, size: f.size })),
    })

    // Basic validation
    if (!userEmail) {
      return res.status(401).json({
        error: 'Unauthorized',
        errorCode: 'UNAUTHORIZED',
        message: 'You must be logged in to upload files',
      })
    }

    if (!fileArray || fileArray.length === 0) {
      return res.status(400).json({
        error: 'No files provided',
        errorCode: 'NO_FILES',
        message: 'Please select at least one file to upload',
      })
    }

    if (!type) {
      return res.status(400).json({
        error: 'Upload type not specified',
        errorCode: 'NO_TYPE',
        message: 'File type (image or video) must be specified',
      })
    }

    const uploadedUrls = []
    const errors = []

    console.log(`Processing ${fileArray.length} files for upload...`)
    for (const file of fileArray) {
      try {
        console.log(`Processing file: ${file.originalFilename}`)

        if (!file) {
          errors.push({ file: 'unknown', message: 'Invalid file object' })
          continue
        }

        // Validate file size (must be > 0)
        if (file.size === 0) {
          errors.push({ file: file.originalFilename, message: 'File is empty. Please select a valid file.' })
          continue
        }

        if (file.size > 50 * 1024 * 1024) {
          errors.push({ file: file.originalFilename, message: 'File size must be less than 50MB' })
          continue
        }

        const publicId = `${type}_${userEmail.split('@')[0]}_${uuidv4()}`

        console.log(`Uploading ${file.originalFilename} to Cloudinary...`, {
          fileSize: file.size,
          mimeType: file.mimetype,
          publicId,
        })

        // Upload using Cloudinary SDK
        const result = await cloudinary.uploader.upload(file.filepath, {
          public_id: publicId,
          folder: type === 'image' ? 'unify/posts' : 'unify/posts/videos',
          resource_type: 'auto',
          overwrite: true,
        })

        console.log(`Successfully uploaded ${file.originalFilename}: ${result.secure_url}`)
        uploadedUrls.push(result.secure_url)
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Unknown error'
        console.error(`Error uploading file ${file.originalFilename}:`, {
          message: errorMsg,
          error: err,
          fileName: file.originalFilename,
          fileSize: file.size,
          fileType: file.mimetype,
        })
        errors.push({
          file: file.originalFilename,
          message: errorMsg,
        })
      }
    }

    if (uploadedUrls.length === 0) {
      return res.status(500).json({
        error: 'Failed to upload files',
        errorCode: 'UPLOAD_FAILED',
        message: 'All files failed to upload',
        details: errors,
      })
    }

    // For avatar/cover uploads, update user in database
    let updatedUser = null
    const primaryUrl = uploadedUrls[0]

    // Handle page-specific uploads (page-avatar, page-cover)
    const isPageUpload = type === 'page-avatar' || type === 'page-cover'
    const pageType = isPageUpload ? type.replace('page-', '') : null

    if (pageType) {
      console.log(`Page upload detected: type=${pageType}, url=${primaryUrl}`)
      // Don't update user, just return the URL - the page will be updated via the pages API
    }

    if (type === 'avatar' || type === 'cover') {
      try {
        const user = await prisma.user.findUnique({ where: { email: userEmail } })
        if (user) {
          const updateData = type === 'avatar' ? { avatarUrl: primaryUrl } : { cover: primaryUrl }
          updatedUser = await prisma.user.update({
            where: { email: userEmail },
            data: updateData,
          })

          // Create a notification item for the feed
          const userName = user.prenom || user.nomUtilisateur || userEmail.split('@')[0]
          const message =
            type === 'avatar'
              ? `${userName} a changé sa photo de profil`
              : `${userName} a changé sa photo de couverture`

          try {
            await prisma.item.create({
              data: {
                title: message,
                content: message,
                author: userName,
                image: primaryUrl,
              },
            })
            console.log('Created feed notification:', message)
          } catch (itemError) {
            console.error('Failed to create feed notification:', itemError)
            // Don't fail the upload if notification creation fails
          }
        }
      } catch (dbError) {
        console.error('Database update error:', dbError)
        // Don't fail the response, just log the error
      }
    }

    // Return success with user data if available
    const response = {
      urls: uploadedUrls,
      success: true,
      url: primaryUrl,
      secure_url: primaryUrl,
    }

    if (updatedUser) {
      response.user = {
        id: updatedUser.id,
        email: updatedUser.email,
        prenom: updatedUser.prenom,
        nom: updatedUser.nom,
        nomUtilisateur: updatedUser.nomUtilisateur,
        avatarUrl: updatedUser.avatarUrl,
        cover: updatedUser.cover,
      }
    }

    if (errors.length > 0) {
      response.warnings = errors
      response.message = `Uploaded ${uploadedUrls.length} of ${fileArray.length} files`
    }
    return res.status(200).json(response)
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error occurred'
    console.error('Error in upload handler:', {
      message: errorMsg,
      error: String(error),
      stack: error instanceof Error ? error.stack : undefined,
    })
    return res.status(500).json({
      error: 'Upload failed',
      errorCode: 'SERVER_ERROR',
      message: errorMsg,
      details: process.env.NODE_ENV === 'development' ? String(error) : undefined,
    })
  }
}
