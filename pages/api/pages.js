import { PrismaClient } from '@prisma/client'
import jwt from 'jsonwebtoken'
import { verifyToken } from '../../lib/auth.js'
import formidable from 'formidable'
import { promises as fs } from 'fs'

const prisma = new PrismaClient()
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret'

export const config = {
  api: { bodyParser: false },
}

async function getUser(req) {
  // First check x-user-email header (used by frontend)
  const headerEmail = req.headers['x-user-email'];
  if (headerEmail) {
    const user = await prisma.user.findUnique({ where: { email: headerEmail } });
    if (user) return user;
  }

  // Try JWT from Authorization header first
  const authHeader = req.headers.authorization
  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      const token = authHeader.split(' ')[1]
      const decoded = jwt.verify(token, JWT_SECRET)
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId || decoded.sub }
      })
      if (user) return user
    } catch (err) {
      console.log('JWT verification failed:', err.message)
    }
  }
  
  // Fallback to query param for testing
  const userEmail = req.query.userEmail
  if (userEmail) {
    const user = await prisma.user.findUnique({ where: { email: userEmail } })
    if (user) return user
  }
  
  return null
}

export default async function handler(req, res) {
  const { method } = req
  const { action, pageId } = req.query

  console.log('Pages API called:', { method, action, pageId, query: req.query, headers: req.headers })

  try {
    // Auth middleware
    const user = await getUser(req)
    if (!user && method !== 'GET') {
      return res.status(401).json({ error: 'Non autorisé. Token ou userEmail requis.' })
    }

    switch (method) {
      case 'GET':
        if (pageId) {
          const page = await prisma.page.findUnique({
            where: { id: parseInt(pageId) || pageId },
            include: {
              owner: true,
              _count: { select: { followers: true, posts: true, members: true } }
            }
          })
          if (!page) return res.status(404).json({ error: 'Page non trouvée' })
          
          const isFollowing = user ? 
            await prisma.pageFollower.findFirst({
              where: { pageId: parseInt(pageId), userEmail: user.email }
            }) : false

          return res.status(200).json({
            ...page,
            profileImage: page.avatar,
            coverImage: page.cover,
            following: !!isFollowing,
            followers: page._count.followers
          })
        } else {
          const pages = await prisma.page.findMany({
            include: {
              owner: true,
              _count: { select: { followers: true } }
            },
            orderBy: { createdAt: 'desc' }
          })
          console.log('Returning pages:', JSON.stringify(pages.map(p => ({ id: p.id, name: p.name, cover: p.cover ? p.cover.substring(0, 30) + '...' : 'no-cover', coverLength: p.cover ? p.cover.length : 0 }))))
          console.log('Cover values in DB:', pages.map(p => ({ id: p.id, coverRaw: p.cover })))
          return res.status(200).json({ pages: pages.map(p => ({
            ...p,
            profileImage: p.avatar,
            coverImage: p.cover,
            followers: p._count.followers
          })) })
        }

      case 'POST': {
        // Parse form data
        const form = formidable()
        const [fields, files] = await form.parse(req)
        
        const name = fields.name?.[0]
        const description = fields.description?.[0] || ''
        const category = fields.category?.[0]
        const privacy = fields.privacy?.[0] || 'public'
        
        if (!name || !category) {
          return res.status(422).json({ error: 'Nom et catégorie requis' })
        }

        // Handle image uploads
        let profileImageBase64 = ''
        let coverImageBase64 = ''

        // Process profile image if provided
        if (files.profileImage) {
          const profileFile = Array.isArray(files.profileImage) ? files.profileImage[0] : files.profileImage
          if (profileFile) {
            const fileBuffer = await fs.readFile(profileFile.filepath)
            profileImageBase64 = `data:${profileFile.mimetype};base64,${fileBuffer.toString('base64')}`
          }
        }

        // Process cover image if provided
        if (files.coverImage) {
          const coverFile = Array.isArray(files.coverImage) ? files.coverImage[0] : files.coverImage
          if (coverFile) {
            const fileBuffer = await fs.readFile(coverFile.filepath)
            coverImageBase64 = `data:${coverFile.mimetype};base64,${fileBuffer.toString('base64')}`
          }
        }

        const newPage = await prisma.page.create({
          data: {
            name,
            description: description || '',
            category: category || 'Autre',
            avatar: profileImageBase64 || '',
            cover: coverImageBase64 || '',
            privacy: privacy || 'public',
            ownerEmail: user.email
          },
          include: { owner: true }
        })

        console.log('Creating page:', { name, category, ownerEmail: user.email });
        return res.status(201).json({ page: { ...newPage, profileImage: newPage.avatar, coverImage: newPage.cover } })
      }

      case 'PUT':
        if (!user || !pageId) {
          return res.status(400).json({ error: 'Utilisateur et pageId requis' })
        }

        // Update page data
        const targetPage = await prisma.page.findUnique({ where: { id: parseInt(pageId) || pageId } })
        console.log('Target page found:', { pageId: parseInt(pageId), targetPage: targetPage ? { id: targetPage.id, ownerEmail: targetPage.ownerEmail } : null, userEmail: user?.email })
        if (!targetPage || targetPage.ownerEmail !== user.email) {
          console.log('Authorization failed:', { targetPageExists: !!targetPage, ownerEmail: targetPage?.ownerEmail, userEmail: user?.email })
          return res.status(403).json({ error: 'Non autorisé à modifier cette page' })
        }

        if (action === 'follow') {
          await prisma.pageFollower.upsert({
            where: { page_userEmail: { pageId: parseInt(pageId) || pageId, userEmail: user.email } },
            update: {},
            create: { pageId: parseInt(pageId) || pageId, userEmail: user.email }
          })
          return res.status(200).json({ success: true, action: 'followed' })
        }

        if (action === 'unfollow') {
          await prisma.pageFollower.deleteMany({
            where: { pageId: parseInt(pageId) || pageId, userEmail: user.email }
          })
          return res.status(200).json({ success: true, action: 'unfollowed' })
        }

        // Update page data
        const { name, description, privacy, profileImage, coverImage } = req.body
        console.log('PUT request for page update:', {
          pageId,
          userEmail: user?.email,
          body: req.body,
          coverImage: coverImage ? coverImage.substring(0, 100) + '...' : 'undefined'
        })

        const updateData = {}
        if (name !== undefined) updateData.name = name
        if (description !== undefined) updateData.description = description
        if (privacy !== undefined) updateData.privacy = privacy
        if (profileImage !== undefined) updateData.avatar = profileImage
        if (coverImage !== undefined) updateData.cover = coverImage

        console.log('Update data prepared:', updateData)

        const updatedPage = await prisma.page.update({
          where: { id: parseInt(pageId) || pageId },
          data: updateData,
          include: { owner: true }
        })

        console.log('Page updated successfully:', {
          id: updatedPage.id,
          cover: updatedPage.cover ? updatedPage.cover.substring(0, 100) + '...' : 'empty'
        })

        return res.status(200).json({ page: { ...updatedPage, profileImage: updatedPage.avatar, coverImage: updatedPage.cover } })

      case 'PATCH': {
        // Handle FormData for image uploads
        if (!user || !pageId) {
          return res.status(400).json({ error: 'Utilisateur et pageId requis' })
        }

        // Parse form data
        const form = formidable()
        const [fields, files] = await form.parse(req)

        // Verify ownership
        const targetPageForPatch = await prisma.page.findUnique({ where: { id: parseInt(pageId) || pageId } })
        if (!targetPageForPatch || targetPageForPatch.ownerEmail !== user.email) {
          return res.status(403).json({ error: 'Non autorisé à modifier cette page' })
        }

        const updateData = {}

        // Process profile image if provided
        if (files.profileImage) {
          const profileFile = Array.isArray(files.profileImage) ? files.profileImage[0] : files.profileImage
          if (profileFile) {
            const fileBuffer = await fs.readFile(profileFile.filepath)
            updateData.avatar = `data:${profileFile.mimetype};base64,${fileBuffer.toString('base64')}`
          }
        }

        // Process cover image if provided
        if (files.coverImage) {
          const coverFile = Array.isArray(files.coverImage) ? files.coverImage[0] : files.coverImage
          if (coverFile) {
            const fileBuffer = await fs.readFile(coverFile.filepath)
            updateData.cover = `data:${coverFile.mimetype};base64,${fileBuffer.toString('base64')}`
          }
        }

        const updatedPage = await prisma.page.update({
          where: { id: parseInt(pageId) || pageId },
          data: updateData,
          include: { owner: true }
        })

        return res.status(200).json({ page: { ...updatedPage, profileImage: updatedPage.avatar, coverImage: updatedPage.cover } })
      }

      case 'DELETE':
        if (!user || !pageId) {
          return res.status(400).json({ error: 'Utilisateur et pageId requis' })
        }
        const targetPageForDelete = await prisma.page.findUnique({ where: { id: parseInt(pageId) || pageId } })
        if (!targetPageForDelete) {
          return res.status(404).json({ error: 'Page non trouvée' })
        }
        if (targetPageForDelete.ownerEmail !== user.email) {
          return res.status(403).json({ error: 'Non autorisé à supprimer cette page' })
        }
        await prisma.page.delete({ where: { id: parseInt(pageId) } })
        return res.status(200).json({ success: true })

      default:
        res.setHeader('Allow', ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'])
        return res.status(405).json({ error: `Méthode ${method} non autorisée` })
    }
  } catch (error) {
    console.error('Pages API Error:', error)
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Ressource non trouvée' })
    }
    return res.status(500).json({ error: error.message || 'Erreur serveur' })
  } finally {
    await prisma.$disconnect()
  }
}
