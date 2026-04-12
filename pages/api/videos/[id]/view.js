import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export default async function handler(req, res) {
  const { method } = req
  const { id } = req.query

  if (method !== 'POST') {
    res.setHeader('Allow', ['POST'])
    return res.status(405).json({ error: `Méthode ${method} non autorisée` })
  }

  try {
    const videoId = parseInt(id, 10)
    
    if (isNaN(videoId)) {
      return res.status(400).json({ error: 'ID vidéo invalide' })
    }

    // Check if video exists
    const video = await prisma.video.findUnique({
      where: { id: videoId }
    })
    
    if (!video) {
      return res.status(404).json({ error: 'Vidéo non trouvée' })
    }

    // Increment view count
    const updatedVideo = await prisma.video.update({
      where: { id: videoId },
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
  } catch (error) {
    console.error('Error recording view:', error)
    return res.status(500).json({ error: 'Erreur serveur' })
  }
}
