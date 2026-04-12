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
        const { action, userEmail, privacy } = req.body

        if (action === 'updatePrivacy') {
          const updatedPage = await prisma.page.update({
            where: { id: pageId },
            data: { privacy }
          })
          return res.status(200).json({ page: updatedPage })
        }

        return res.status(400).json({ error: 'Action non reconnue' })

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