import { createNotification } from 'lib/notifications'
import prisma from 'lib/prisma'
import fs from 'fs'
import path from 'path'
import { promisify } from 'util'
import jwt from 'jsonwebtoken'
const writeFileAsync = promisify(fs.writeFile)
const mkdirAsync = promisify(fs.mkdir)
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret'

// Configuration des médias
const MEDIA_CONFIG = {
  maxFileSize: 50 * 1024 * 1024, // 50MB
  allowedTypes: {
    image: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'],
    video: ['video/mp4', 'video/webm', 'video/ogg', 'video/avi', 'video/mov'],
    document: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain', 'application/rtf']
  },
  uploadDir: path.join(process.cwd(), 'public', 'uploads', 'group-media')
}

// Fonction pour sauvegarder un média
async function saveMedia(base64Data, fileName, mediaType) {
  try {
    // Créer le dossier s'il n'existe pas
    await mkdirAsync(MEDIA_CONFIG.uploadDir, { recursive: true })

    // Générer un nom de fichier unique
    const timestamp = Date.now()
    const extension = getExtensionFromMimeType(mediaType)
    const uniqueFileName = `${timestamp}_${fileName}.${extension}`
    const filePath = path.join(MEDIA_CONFIG.uploadDir, uniqueFileName)

    // Convertir base64 en buffer et sauvegarder
    const base64String = base64Data.replace(/^data:[^;]+;base64,/, '')
    const buffer = Buffer.from(base64String, 'base64')
    await writeFileAsync(filePath, buffer)

    // Retourner le chemin relatif pour le web
    return `/uploads/group-media/${uniqueFileName}`
  } catch (error) {
    console.error('Erreur lors de la sauvegarde du média:', error)
    throw new Error('Erreur lors de la sauvegarde du fichier')
  }
}

// Fonction pour obtenir l'extension depuis le type MIME
function getExtensionFromMimeType(mimeType) {
  const extensions = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/gif': 'gif',
    'image/webp': 'webp',
    'image/svg+xml': 'svg',
    'video/mp4': 'mp4',
    'video/webm': 'webm',
    'video/ogg': 'ogg',
    'video/avi': 'avi',
    'video/mov': 'mov',
    'application/pdf': 'pdf',
    'application/msword': 'doc',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
    'text/plain': 'txt',
    'application/rtf': 'rtf'
  }
  return extensions[mimeType] || 'bin'
}

// Fonction pour valider un média
function validateMedia(base64Data, mediaType) {
  // Vérifier la taille
  const base64String = base64Data.replace(/^data:[^;]+;base64,/, '')
  const fileSize = (base64String.length * 3) / 4 // Approximation de la taille en bytes

  if (fileSize > MEDIA_CONFIG.maxFileSize) {
    throw new Error(`Fichier trop volumineux. Maximum: ${MEDIA_CONFIG.maxFileSize / (1024 * 1024)}MB`)
  }

  // Vérifier le type
  const isAllowed = Object.values(MEDIA_CONFIG.allowedTypes).some(types => types.includes(mediaType))
  if (!isAllowed) {
    throw new Error('Type de fichier non supporté')
  }

  return true
}

// Fonction pour détecter le type de média depuis base64
function getMediaTypeFromBase64(base64Data) {
  const match = base64Data.match(/^data:([^;]+);base64,/)
  return match ? match[1] : 'application/octet-stream'
}

// Fonction pour obtenir la catégorie de média
function getMediaCategory(mimeType) {
  if (MEDIA_CONFIG.allowedTypes.image.includes(mimeType)) return 'image'
  if (MEDIA_CONFIG.allowedTypes.video.includes(mimeType)) return 'video'
  if (MEDIA_CONFIG.allowedTypes.document.includes(mimeType)) return 'document'
  return 'unknown'
}

// Fonction pour vérifier le token et obtenir l'utilisateur
async function getUserFromToken(req) {
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null
  }
  
  try {
    const token = authHeader.split(' ')[1]
    const decoded = jwt.verify(token, JWT_SECRET)
    if (!decoded || !decoded.userId) {
      return null
    }
    
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId }
    })
    return user
  } catch (err) {
    console.error('Token verification failed:', err.message)
    return null
  }
}

export default async function handler(req, res) {
  const { method } = req
  const { id } = req.query

  try {
    switch (method) {
      case 'GET':
        const posts = await prisma.post.findMany({
          where: { groupId: parseInt(id, 10) },
          include: { author: true },
          orderBy: { createdAt: 'desc' }
        })

        return res.status(200).json({ posts })

      case 'POST':
        const { content, userEmail, media, mediaType, fileName } = req.body

        // Verify group exists
        const groupExists = await prisma.group.findUnique({ where: { id: parseInt(id, 10) } })
        if (!groupExists) return res.status(404).json({ error: 'Groupe non trouvé' })

        // Try to get user from token first, then fallback to email from request body
        let user = await getUserFromToken(req)
        if (!user) {
          // Fallback to email from request body for backward compatibility
          user = await prisma.user.findUnique({ where: { email: userEmail } })
        }
        if (!user) return res.status(404).json({ error: 'Utilisateur non trouvé' })

        let mediaUrl = null
        let savedMediaType = null

        // Traiter le média s'il est fourni
        if (media) {
          try {
            const mediaData = media
            const detectedMediaType = mediaType || getMediaTypeFromBase64(mediaData)

            // Valider le média
            validateMedia(mediaData, detectedMediaType)

            // Sauvegarder le média
            const originalFileName = fileName || `media_${Date.now()}`
            mediaUrl = await saveMedia(mediaData, originalFileName, detectedMediaType)
            savedMediaType = getMediaCategory(detectedMediaType)
          } catch (error) {
            return res.status(400).json({ error: error.message })
          }
        }

        const newPost = await prisma.post.create({
          data: {
            content,
            authorId: user.id,
            groupId: parseInt(id, 10),
            image: mediaUrl,
            mediaType: savedMediaType
          },
          include: { author: true }
        })

        // Notify group members about new post
        try {
          const group = await prisma.group.findUnique({
            where: { id: parseInt(id, 10) },
            select: { name: true, membersList: true }
          })
          if (group && group.membersList) {
            // Parse members from JSON string
            const memberEmails = JSON.parse(group.membersList || '[]')
            for (const memberEmail of memberEmails) {
              if (memberEmail !== userEmail) {
                const memberUser = await prisma.user.findUnique({ where: { email: memberEmail } })
                if (memberUser) {
                  await createNotification({
                    userId: memberUser.id,
                    type: 'comment',
                    actorId: user.id,
                    content: `a publié dans un groupe que vous suivez: ${group.name || 'groupe'}`,
                    url: `/groupes?id=${id}`
                  })
                }
              }
            }
          }
        } catch (e) {
          console.error('group post notification error', e)
        }

        // Detect mentions
        try {
          const mentionRegex = /@(\w+)/g
          const mentions = content.match(mentionRegex)
          if (mentions) {
            const uniqueMentions = [...new Set(mentions.map(m => m.slice(1)))]
            const mentionedUsers = await prisma.user.findMany({
              where: {
                OR: [
                  { nomUtilisateur: { in: uniqueMentions } },
                  { email: { in: uniqueMentions.map(m => m.toLowerCase() + '@unify.com') } }
                ]
              }
            })
            for (const mentioned of mentionedUsers) {
              if (mentioned.id !== user.id) {
                await createNotification({
                  userId: mentioned.id,
                  type: 'mention',
                  actorId: user.id,
                  content: `vous a identifié dans une publication de groupe`,
                  url: `/groupes?id=${id}`
                })
              }
            }
          }
        } catch (e) {
          console.error('mention notification error', e)
        }

        return res.status(201).json({ post: newPost })

      default:
        res.setHeader('Allow', ['GET', 'POST'])
        return res.status(405).json({ error: `Méthode ${method} non autorisée` })
    }
  } catch (error) {
    console.error('API Error:', error)
    console.error('Error message:', error.message)
    console.error('Error stack:', error.stack)
    return res.status(500).json({ error: 'Erreur serveur', details: error.message })
  }
}

// Increase body size limit to 50MB for file uploads
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '50mb',
    },
  },
}