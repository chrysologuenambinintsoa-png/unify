import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export default async function handler(req, res) {
  const { method } = req
  const { pageId } = req.query

  console.log('Events API called:', { method, pageId })

  try {
    if (!pageId) {
      return res.status(400).json({ error: 'pageId requis' })
    }

    const numericPageId = parseInt(pageId, 10)
    if (isNaN(numericPageId)) {
      return res.status(400).json({ error: 'ID de page invalide' })
    }

    switch (method) {
      case 'GET':
        // Get all posts that have event data for this page
        const posts = await prisma.pagePost.findMany({
          where: {
            pageId: numericPageId,
            event: { not: null }
          },
          orderBy: { createdAt: 'desc' }
        })

        // Parse event data from each post
        const events = posts
          .map(post => {
            try {
              const eventData = typeof post.event === 'string' 
                ? JSON.parse(post.event) 
                : post.event
              return {
                id: post.id,
                title: eventData?.title || post.content?.substring(0, 50),
                date: eventData?.date,
                location: eventData?.location,
                content: post.content,
                createdAt: post.createdAt
              }
            } catch (e) {
              return null
            }
          })
          .filter(Boolean)
          .sort((a, b) => new Date(b.date) - new Date(a.date))

        return res.status(200).json(events)

      default:
        res.setHeader('Allow', ['GET'])
        return res.status(405).json({ error: `Méthode ${method} non autorisée` })
    }
  } catch (error) {
    console.error('Events API Error:', error)
    return res.status(500).json({ error: error.message || 'Erreur serveur' })
  } finally {
    await prisma.$disconnect()
  }
}