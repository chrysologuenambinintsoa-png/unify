import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export default async function handler(req, res) {
  const { method } = req
  let { id } = req.query

  try {
    // Handle nested routes like /api/videos/3/view
    if (Array.isArray(id)) {
      const [videoId, ...rest] = id
      
      // Handle /api/videos/[id]/view
      if (rest[0] === 'view' && method === 'POST') {
        const parsedId = parseInt(videoId, 10)
        if (isNaN(parsedId)) {
          return res.status(400).json({ error: 'ID vidéo invalide' })
        }

        const video = await prisma.video.findUnique({
          where: { id: parsedId }
        })
        
        if (!video) {
          return res.status(404).json({ error: 'Vidéo non trouvée' })
        }

        const updatedVideo = await prisma.video.update({
          where: { id: parsedId },
          data: {
            views: {
              increment: 1
            }
          }
        })

        return res.status(200).json({ 
          success: true,
          views: updatedVideo.views 
        })
      }

      id = videoId
    }

    // Parse ID as integer for database
    const parsedId = parseInt(id, 10)
    if (isNaN(parsedId)) {
      return res.status(400).json({ error: 'ID vidéo invalide' })
    }

    switch (method) {
      case 'GET':
        const video = await prisma.video.findUnique({
          where: { id: parsedId },
          include: {
            comments: {
              include: { author: true },
              orderBy: { createdAt: 'desc' }
            }
          }
        })
        if (!video) return res.status(404).json({ error: 'Vidéo non trouvée' })

        return res.status(200).json({ video })

      case 'PUT':
        const updateData = req.body
        const updatedVideo = await prisma.video.update({
          where: { id: parsedId },
          data: updateData
        })

        return res.status(200).json({ video: updatedVideo })

      case 'DELETE':
        await prisma.video.delete({
          where: { id: parsedId }
        })

        return res.status(200).json({ success: true })

      default:
        res.setHeader('Allow', ['GET', 'PUT', 'DELETE', 'POST'])
        return res.status(405).json({ error: `Méthode ${method} non autorisée` })
    }
  } catch (error) {
    console.error(error)
    return res.status(500).json({ error: 'Erreur serveur' })
  }
}