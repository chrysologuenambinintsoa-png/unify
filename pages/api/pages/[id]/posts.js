import { PrismaClient } from '@prisma/client'
import jwt from 'jsonwebtoken'
import { verifyToken } from '../../../../lib/auth.js'
import { createNotification } from '../../../../lib/notifications.js'

const prisma = new PrismaClient()
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret'

async function getUser(req) {
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
  const { id: pageId } = req.query

  if (!pageId || isNaN(pageId)) {
    return res.status(400).json({ error: 'id requis et doit être un nombre' })
  }

  try {
    const user = await getUser(req)
    if (!user && method !== 'GET') {
      return res.status(401).json({ error: 'Non autorisé. Token ou userEmail requis.' })
    }

    switch (method) {
      case 'GET':
        const page = await prisma.page.findUnique({ where: { id: parseInt(pageId) } })
        if (!page) {
          return res.status(404).json({ error: 'Page non trouvée' })
        }

        // Check if this page has a sponsor (owner has active sponsor)
        const hasSponsor = await prisma.sponsor.findFirst({
          where: { ownerEmail: page.ownerEmail, active: true }
        })

        const posts = await prisma.pagePost.findMany({
          where: { pageId: parseInt(pageId) },
          include: { author: true },
          orderBy: { createdAt: 'desc' }
        })

        const formattedPosts = posts.map(p => ({
          id: p.id,
          content: p.content,
          author: {
            id: page.id || 'page-1',
            name: page.name || 'Page',
            avatar: page.avatar || '/images/default-page.png',
            verified: page.verified || false
          },
          sponsorId: page.id,
          date: p.createdAt.toISOString(),
          likes: p.likes || 0,
          comments: Array.isArray(p.comments) ? p.comments : [],
          backgroundColor: p.backgroundColor || null,
          textColor: p.textColor || null,
          backgroundImage: p.backgroundImage || null,
          video: p.video || null,
          images: (() => {
            if (Array.isArray(p.images)) return p.images;
            if (typeof p.images === 'string') {
              try {
                const arr = JSON.parse(p.images);
                return Array.isArray(arr) ? arr : [];
              } catch { return []; }
            }
            return [];
          })(),
          tags: p.tags ? (Array.isArray(p.tags) ? p.tags : (() => { try { const arr = JSON.parse(p.tags); return Array.isArray(arr) ? arr : []; } catch { return []; } })()) : [],
          feeling: p.feeling || null,
          location: p.location || null,
          event: p.event ? (typeof p.event === 'string' ? (() => { try { return JSON.parse(p.event); } catch { return null; } })() : p.event) : null,
          createdAt: p.createdAt,
          updatedAt: p.updatedAt,
          isSponsor: !!hasSponsor,
          reactions: Array.isArray(p.reactions) ? p.reactions : [],
          userReaction: null,
          saved: false,
          pinned: !!p.pinned
        }))

        return res.status(200).json(formattedPosts)

      case 'POST': {
        const { content, tags, feeling, location, event, images, backgroundColor, textColor, backgroundImage, video } = req.body
        // Autoriser si content OU images OU event OU video (dans payload, images ou event ou video)
        const hasContent = content && content.trim();
        const hasImages = images && (Array.isArray(images) ? images.length > 0 : typeof images === 'string' && images.length > 0);
        const hasEvent = event && (event.title || event.date);
        const hasVideo = video && typeof video === 'string' && video.length > 0;
        if (!hasContent && !hasImages && !hasEvent && !hasVideo) {
          return res.status(422).json({ error: 'Contenu, image, vidéo ou événement requis' })
        }

        // Check if page exists and user owns it
        const page = await prisma.page.findUnique({
          where: { id: parseInt(pageId) },
          include: { owner: true }
        })
        if (!page) {
          return res.status(404).json({ error: 'Page non trouvée' })
        }
        // Log pour debug : emails comparés
        console.log('[DEBUG POST PAGE]', {
          userEmail: user.email,
          pageOwnerEmail: page.ownerEmail,
          userId: user.id,
          pageId: page.id
        });
if (page.ownerEmail !== user.email && process.env.NODE_ENV === 'production') {
          return res.status(403).json({ error: 'Non authorized to post on this page' })
        }

        const newPost = await prisma.pagePost.create({
          data: {
            pageId: parseInt(pageId),
            authorEmail: user.email,
            content: content.trim(),
            images: images ? JSON.stringify(images) : null,
            video: video || null,
            tags: tags ? JSON.stringify(tags) : null,
            feeling: feeling || null,
            location: location || null,
            event: event ? JSON.stringify(event) : null,
            backgroundColor: backgroundColor || null,
            textColor: textColor || null,
            backgroundImage: backgroundImage || null
          },
          include: { author: true, page: true }
        })

        // Create notification for page owner
        try {
          if (page.owner.id !== user.id) {
            await createNotification({
              userId: page.owner.id,
              type: 'comment',
              actorId: user.id,
              content: `a publié sur votre page: ${page.name || 'page'}`,
              url: `/pages?id=${pageId}`
            })
          }
        } catch (e) {
          console.error('post notification error', e)
        }

        // Detect mentions and notify mentioned users
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
                  content: `vous a identifié dans une publication`,
                  url: `/pages?id=${pageId}`
                })
              }
            }
          }
        } catch (e) {
          console.error('mention notification error', e)
        }

        const formattedPost = {
          id: newPost.id,
          content: newPost.content,
          author: {
            id: page.id || 'page-1',
            name: page.name || 'Page',
            avatar: page.avatar || '/api/placeholder/40/40',
            verified: page.verified || false
          },
          sponsorId: page.id,
          date: newPost.createdAt.toISOString(),
          likes: newPost.likes || 0,
          comments: Array.isArray(newPost.comments) ? newPost.comments : [],
          backgroundColor: newPost.backgroundColor || null,
          textColor: newPost.textColor || null,
          backgroundImage: newPost.backgroundImage || null,
          video: newPost.video || null,
          images: (() => {
            if (Array.isArray(newPost.images)) return newPost.images;
            if (typeof newPost.images === 'string') {
              try {
                const arr = JSON.parse(newPost.images);
                return Array.isArray(arr) ? arr : [];
              } catch { return []; }
            }
            return [];
          })(),
          tags: newPost.tags ? (Array.isArray(newPost.tags) ? newPost.tags : (() => { try { const arr = JSON.parse(newPost.tags); return Array.isArray(arr) ? arr : []; } catch { return []; } })()) : [],
          feeling: newPost.feeling || null,
          location: newPost.location || null,
          event: newPost.event ? (typeof newPost.event === 'string' ? (() => { try { return JSON.parse(newPost.event); } catch { return null; } })() : newPost.event) : null,
          createdAt: newPost.createdAt,
          updatedAt: newPost.updatedAt,
          isSponsor: !!hasSponsor,
          reactions: [],
          userReaction: null,
          saved: false,
          pinned: !!newPost.pinned
        }

        return res.status(201).json(formattedPost)
      }

      default:
        res.setHeader('Allow', ['GET', 'POST'])
        return res.status(405).json({ error: `Méthode ${method} non autorisée` })
    }
  } catch (error) {
    console.error('Pages Posts API Error:', error)
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Ressource non trouvée' })
    }
    return res.status(500).json({ error: error.message || 'Erreur serveur' })
  } finally {
    await prisma.$disconnect()
  }
}