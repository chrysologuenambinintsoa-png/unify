import { PrismaClient } from '@prisma/client'
import { createNotification } from 'lib/notifications'

const prisma = new PrismaClient()

export default async function handler(req, res) {
  const { method } = req
  const { id } = req.query

  try {
    switch (method) {
      case 'POST':
        const { userEmail } = req.body

        const user = await prisma.user.findUnique({ where: { email: userEmail } })
        if (!user) return res.status(404).json({ error: 'Utilisateur non trouvé' })

        // Check if already liked
        const existingLike = await prisma.videoLike.findUnique({
          where: {
            videoId_userId: {
              videoId: id,
              userId: user.id
            }
          }
        })

        if (existingLike) {
          // Unlike
          await prisma.videoLike.delete({
            where: {
              videoId_userId: {
                videoId: id,
                userId: user.id
              }
            }
          })
        } else {
        // Like
          await prisma.videoLike.create({
            data: {
              videoId: id,
              userId: user.id
            }
          })

          // Create notification for video owner
          try {
            const video = await prisma.video.findUnique({ 
              where: { id: id },
              select: { userId: true, title: true }
            })
            if (video && video.userId !== user.id) {
              await createNotification({
                userId: video.userId,
                type: 'like',
                actorId: user.id,
                content: `aime votre vidéo: ${video.title || 'vidéo'}`,
                url: `/videos?id=${id}`
              })
            }
          } catch (e) {
            console.error('like notification error', e)
          }
        }

        // Get updated like count
        const likeCount = await prisma.videoLike.count({
          where: { videoId: id }
        })

        return res.status(200).json({ likes: likeCount })

      default:
        res.setHeader('Allow', ['POST'])
        return res.status(405).json({ error: `Méthode ${method} non autorisée` })
    }
  } catch (error) {
    console.error(error)
    return res.status(500).json({ error: 'Erreur serveur' })
  }
}