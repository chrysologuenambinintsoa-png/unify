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
      case 'POST': {
        const user = await getUser(req)
        if (!user) {
          return res.status(401).json({ error: 'Non autorisé' })
        }

        const page = await prisma.page.findUnique({ where: { id: pageId } })
        if (!page) {
          return res.status(404).json({ error: 'Page non trouvée' })
        }

        const existingLike = await prisma.pageLike.findUnique({
          where: {
            pageId_userEmail: {
              pageId: pageId,
              userEmail: user.email
            }
          }
        })

        if (existingLike) {
          return res.status(400).json({ error: 'Vous avez déjà aimé cette page' })
        }

        await prisma.pageLike.create({
          data: {
            pageId: pageId,
            userEmail: user.email
          }
        })

        const likesCount = await prisma.pageLike.count({
          where: { pageId: pageId }
        })

        return res.status(200).json({ 
          success: true, 
          message: 'Vous avez aimé cette page',
          isLiked: true,
          likesCount
        })
      }

      case 'DELETE': {
        const user = await getUser(req)
        if (!user) {
          return res.status(401).json({ error: 'Non autorisé' })
        }

        const existingLike = await prisma.pageLike.findUnique({
          where: {
            pageId_userEmail: {
              pageId: pageId,
              userEmail: user.email
            }
          }
        })

        if (!existingLike) {
          return res.status(400).json({ error: 'Vous n\'avez pas aimé cette page' })
        }

        await prisma.pageLike.delete({
          where: {
            pageId_userEmail: {
              pageId: pageId,
              userEmail: user.email
            }
          }
        })

        const likesCount = await prisma.pageLike.count({
          where: { pageId: pageId }
        })

        return res.status(200).json({ 
          success: true, 
          message: 'Vous n\'aimez plus cette page',
          isLiked: false,
          likesCount
        })
      }

      case 'GET': {
        const page = await prisma.page.findUnique({ where: { id: pageId } })
        if (!page) {
          return res.status(404).json({ error: 'Page non trouvée' })
        }

        const likesCount = await prisma.pageLike.count({
          where: { pageId: pageId }
        })

        const user = await getUser(req)
        let isLiked = false
        if (user) {
          const existingLike = await prisma.pageLike.findUnique({
            where: {
              pageId_userEmail: {
                pageId: pageId,
                userEmail: user.email
              }
            }
          })
          isLiked = !!existingLike
        }

        return res.status(200).json({ 
          isLiked,
          likesCount
        })
      }

      default:
        res.setHeader('Allow', ['GET', 'POST', 'DELETE'])
        return res.status(405).json({ error: `Méthode ${method} non autorisée` })
    }
  } catch (error) {
    console.error(error)
    return res.status(500).json({ error: 'Erreur serveur' })
  }
}