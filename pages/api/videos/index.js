import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export default async function handler(req, res) {
  const { method } = req

  try {
    switch (method) {
      case 'GET':
        const videos = await prisma.video.findMany({
          orderBy: { createdAt: 'desc' },
          include: {
            author: {
              select: {
                id: true,
                email: true,
                avatarUrl: true
              }
            },
            _count: {
              select: {
                comments: true,
                likedBy: true
              }
            }
          }
        })

        return res.status(200).json({ videos })

      case 'POST':
        const { title, description, url, thumbnail, userEmail } = req.body

        // Validation
        if (!title || !url || !userEmail) {
          return res.status(400).json({ 
            error: 'Les champs title, url et userEmail sont requis' 
          })
        }

        const user = await prisma.user.findUnique({ 
          where: { email: userEmail } 
        })
        if (!user) {
          return res.status(404).json({ error: 'Utilisateur non trouvé' })
        }

        const newVideo = await prisma.video.create({
          data: {
            title,
            description: description || '',
            url,
            thumbnail: thumbnail || '',
            authorEmail: userEmail
          },
          include: {
            author: {
              select: {
                id: true,
                email: true,
                avatarUrl: true
              }
            }
          }
        })

        return res.status(201).json({ video: newVideo })

      default:
        res.setHeader('Allow', ['GET', 'POST'])
        return res.status(405).json({ 
          error: `Méthode ${method} non autorisée` 
        })
    }
  } catch (error) {
    console.error('Error in /api/videos:', error)
    return res.status(500).json({ error: 'Erreur serveur' })
  }
}
