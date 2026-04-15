import { PrismaClient } from '@prisma/client'
import jwt from 'jsonwebtoken'

const prisma = new PrismaClient()
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret'

async function getUser(req) {
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
  
  const userEmail = req.query.userEmail || (req.body && req.body.userEmail)
  if (userEmail) {
    const user = await prisma.user.findUnique({ where: { email: userEmail } })
    if (user) return user
  }
  
  return null
}

export default async function handler(req, res) {
  const { method } = req
  const { id } = req.query
  const pageId = parseInt(id)

  try {
    switch (method) {
      case 'GET':
        const page = await prisma.page.findUnique({
          where: { id: pageId },
          include: {
            followers: {
              include: { user: true }
            },
            posts: {
              include: { author: true },
              orderBy: { createdAt: 'desc' }
            }
          }
        })
        if (!page) return res.status(404).json({ error: 'Page non trouvée' })

        return res.status(200).json({ page })

      case 'PUT':
        const user = await getUser(req)
        console.log('[pages/[id]] PUT - user:', user?.email);
        
        // Fallback: if no JWT but userEmail provided in body or query, try to get user
        let currentUser = user;
        if (!currentUser) {
          const email = req.body?.userEmail || req.query?.userEmail;
          if (email) {
            currentUser = await prisma.user.findUnique({ 
              where: { email } 
            });
            console.log('[pages/[id]] PUT - fallback user from:', email, currentUser?.email);
          }
        }
        
        if (!currentUser) {
          return res.status(401).json({ error: 'Non autorisé' })
        }

        const { action, privacy, name, description, category, subcategory, address, phone, website, contactEmail, isPublic, isPublished, notificationsEnabled, userEmail, avatar, cover } = req.body
        console.log('[pages/[id]] PUT - body:', req.body);

        const targetPage = await prisma.page.findUnique({ where: { id: pageId } })
        console.log('[pages/[id]] PUT - targetPage:', targetPage?.id, 'ownerEmail:', targetPage?.ownerEmail);
        console.log('[pages/[id]] PUT - currentUser:', currentUser?.email);
        if (!targetPage) {
          return res.status(404).json({ error: 'Page non trouvée' })
        }
        if (targetPage.ownerEmail !== currentUser.email) {
          console.log('[pages/[id]] PUT - Permission denied:', targetPage.ownerEmail, '!=', currentUser.email);
          return res.status(403).json({ error: 'Non autorisé à modifier cette page' })
        }

        if (action === 'updatePrivacy') {
          const updatedPage = await prisma.page.update({
            where: { id: pageId },
            data: { privacy }
          })
          return res.status(200).json({ page: updatedPage })
        }

        const updateData = {}
        if (name !== undefined) updateData.name = name
        if (description !== undefined) updateData.description = description
        if (category !== undefined) updateData.category = category
        if (subcategory !== undefined) updateData.subcategory = subcategory
        if (address !== undefined) updateData.address = address
        if (phone !== undefined) updateData.phone = phone
        if (website !== undefined) updateData.website = website
        if (contactEmail !== undefined) updateData.contactEmail = contactEmail
        if (privacy !== undefined) updateData.privacy = privacy
        if (isPublic !== undefined) updateData.isPublic = isPublic
        if (isPublished !== undefined) updateData.isPublished = isPublished
        if (notificationsEnabled !== undefined) updateData.notificationsEnabled = notificationsEnabled
        if (avatar !== undefined) updateData.avatar = avatar
        if (cover !== undefined) updateData.cover = cover

        if (Object.keys(updateData).length > 0) {
          const updatedPage = await prisma.page.update({
            where: { id: pageId },
            data: updateData
          })
          return res.status(200).json({ page: updatedPage })
        }

        return res.status(400).json({ error: 'Aucune donnée à mettre à jour' })

      case 'DELETE': {
        const user = await getUser(req)
        if (!user) {
          return res.status(401).json({ error: 'Non autorisé' })
        }
        
        const targetPage = await prisma.page.findUnique({ where: { id: pageId } })
        if (!targetPage) {
          return res.status(404).json({ error: 'Page non trouvée' })
        }
        if (targetPage.ownerEmail !== user.email) {
          return res.status(403).json({ error: 'Non autorisé à supprimer cette page' })
        }
        
        await prisma.page.delete({ where: { id: pageId } })
        return res.status(200).json({ success: true })
      }

      default:
        res.setHeader('Allow', ['GET', 'PUT', 'DELETE'])
        return res.status(405).json({ error: `Méthode ${method} non autorisée` })
    }
  } catch (error) {
    console.error(error)
    return res.status(500).json({ error: 'Erreur serveur' })
  }
}