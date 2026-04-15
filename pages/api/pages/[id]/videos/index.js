import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export default async function handler(req, res) {
  const { method } = req
  const { id } = req.query
  const pageId = parseInt(id)

  if (!pageId || isNaN(pageId)) {
    return res.status(400).json({ error: 'ID de page requis et doit être un nombre' })
  }

  try {
    switch (method) {
      case 'GET': {
        const page = await prisma.page.findUnique({ where: { id: pageId } })
        if (!page) {
          return res.status(404).json({ error: 'Page non trouvée' })
        }

        const videos = await prisma.video.findMany({
          where: { authorEmail: page.ownerEmail },
          orderBy: { createdAt: 'desc' }
        })

        const formattedVideos = videos.map(v => ({
          id: v.id,
          title: v.title,
          description: v.description,
          url: v.url,
          thumbnail: v.thumbnail,
          duration: v.duration,
          views: v.views,
          likes: v.likes,
          createdAt: v.createdAt.toISOString()
        }))

        return res.status(200).json(formattedVideos)
      }

      default:
        res.setHeader('Allow', ['GET'])
        return res.status(405).json({ error: `Méthode ${method} non autorisée` })
    }
  } catch (error) {
    console.error('Page Videos API Error:', error)
    return res.status(500).json({ error: 'Erreur serveur' })
  } finally {
    await prisma.$disconnect()
  }
}