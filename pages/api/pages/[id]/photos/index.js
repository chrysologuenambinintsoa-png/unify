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

        const posts = await prisma.pagePost.findMany({
          where: { pageId: pageId },
          select: {
            images: true,
            createdAt: true,
            content: true
          },
          orderBy: { createdAt: 'desc' }
        })

        const photos = []
        posts.forEach(post => {
          let imagesArray = []
          if (Array.isArray(post.images)) {
            imagesArray = post.images
          } else if (typeof post.images === 'string') {
            try {
              const parsed = JSON.parse(post.images)
              imagesArray = Array.isArray(parsed) ? parsed : []
            } catch {
              imagesArray = []
            }
          }

          imagesArray.forEach(imgUrl => {
            if (imgUrl && typeof imgUrl === 'string' && (imgUrl.startsWith('http') || imgUrl.startsWith('/'))) {
              photos.push({
                url: imgUrl,
                caption: post.content || '',
                createdAt: post.createdAt.toISOString()
              })
            }
          })
        })

        return res.status(200).json(photos)
      }

      default:
        res.setHeader('Allow', ['GET'])
        return res.status(405).json({ error: `Méthode ${method} non autorisée` })
    }
  } catch (error) {
    console.error('Page Photos API Error:', error)
    return res.status(500).json({ error: 'Erreur serveur' })
  } finally {
    await prisma.$disconnect()
  }
}