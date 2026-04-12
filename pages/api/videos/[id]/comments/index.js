import { PrismaClient } from '@prisma/client'
import { createNotification } from 'lib/notifications'

const prisma = new PrismaClient()

export default async function handler(req, res) {
  const { method } = req
  const { id } = req.query

  try {
    switch (method) {
      case 'GET':
        const comments = await prisma.videoComment.findMany({
          where: { videoId: id },
          include: { author: true },
          orderBy: { createdAt: 'desc' }
        })

        return res.status(200).json({ comments })

      case 'POST':
        const { content, userEmail } = req.body

        const user = await prisma.user.findUnique({ where: { email: userEmail } })
        if (!user) return res.status(404).json({ error: 'Utilisateur non trouvé' })

        const newComment = await prisma.videoComment.create({
          data: {
            content,
            authorId: user.id,
            videoId: id
          },
          include: { author: true }
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
              type: 'comment',
              actorId: user.id,
              content: `a commenté votre vidéo: ${video.title || 'vidéo'}`,
              url: `/videos?id=${id}`
            })
          }
        } catch (e) {
          console.error('comment notification error', e)
        }

        return res.status(201).json({ comment: newComment })

      default:
        res.setHeader('Allow', ['GET', 'POST'])
        return res.status(405).json({ error: `Méthode ${method} non autorisée` })
    }
  } catch (error) {
    console.error(error)
    return res.status(500).json({ error: 'Erreur serveur' })
  }
}