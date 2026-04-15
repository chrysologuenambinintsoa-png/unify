import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export default async function handler(req, res) {
  const { method } = req
  const { pageId } = req.query

  console.log('Event Participate API called:', { method, pageId })

  if (method !== 'POST') {
    res.setHeader('Allow', ['POST'])
    return res.status(405).json({ error: `Méthode ${method} non autorisée` })
  }

  try {
    if (!pageId) {
      return res.status(400).json({ error: 'pageId requis' })
    }

    const numericPageId = parseInt(pageId, 10)
    if (isNaN(numericPageId)) {
      return res.status(400).json({ error: 'ID de page invalide' })
    }

    const { postId, userEmail, eventTitle, eventDate, eventLocation } = req.body

    if (!userEmail) {
      return res.status(400).json({ error: 'Email utilisateur requis' })
    }

    if (!postId) {
      return res.status(400).json({ error: 'ID du post requis' })
    }

    // Find the user
    const user = await prisma.user.findUnique({
      where: { email: userEmail }
    })

    if (!user) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' })
    }

    // Find the post
    const post = await prisma.pagePost.findFirst({
      where: {
        id: postId,
        pageId: numericPageId
      }
    })

    if (!post) {
      return res.status(404).json({ error: 'Post non trouvé' })
    }

    // Check if user already participates
    const existingParticipant = await prisma.eventParticipant.findFirst({
      where: {
        postId: postId,
        userId: user.id
      }
    })

    let isParticipating = false
    let participantsCount = 0

    if (existingParticipant) {
      // Remove participation
      await prisma.eventParticipant.delete({
        where: { id: existingParticipant.id }
      })
      isParticipating = false
    } else {
      // Add participation
      await prisma.eventParticipant.create({
        data: {
          postId: postId,
          userId: user.id,
          eventTitle: eventTitle || null,
          eventDate: eventDate ? new Date(eventDate) : null,
          eventLocation: eventLocation || null
        }
      })
      isParticipating = true
    }

    // Get updated participants count
    const countResult = await prisma.eventParticipant.count({
      where: { postId: postId }
    })
    participantsCount = countResult

    console.log('Event participation updated:', { postId, userEmail, isParticipating, participantsCount })

    return res.status(200).json({
      isParticipating,
      participantsCount
    })

  } catch (error) {
    console.error('Event Participate API Error:', error)
    return res.status(500).json({ error: error.message || 'Erreur serveur' })
  } finally {
    await prisma.$disconnect()
  }
}
