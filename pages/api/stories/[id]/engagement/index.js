import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  const { id } = req.query

  if (!id) {
    return res.status(400).json({ message: 'Story ID required' })
  }

  try {
    // Récupérer la story avec les vues et réactions
    const story = await prisma.story.findUnique({
      where: { id: id },
      select: {
        viewedBy: true,
        likedBy: true
      }
    })

    if (!story) {
      return res.status(404).json({ message: 'Story not found' })
    }

    // Parser les IDs des utilisateurs
    const viewerIds = JSON.parse(story.viewedBy || '[]')
      .map((v) => parseInt(v))
      .filter((n) => !isNaN(n))
    const reactorIds = JSON.parse(story.likedBy || '[]')
      .map((v) => parseInt(v))
      .filter((n) => !isNaN(n))

    // Récupérer les détails des utilisateurs qui ont vu la story
    const viewers = await prisma.user.findMany({
      where: {
        id: { in: viewerIds }
      },
      select: {
        id: true,
        prenom: true,
        nom: true,
        avatar: true,
        avatarUrl: true
      }
    })

    // Récupérer les détails des utilisateurs qui ont réagi
    const reactors = await prisma.user.findMany({
      where: {
        id: { in: reactorIds }
      },
      select: {
        id: true,
        prenom: true,
        nom: true,
        avatar: true,
        avatarUrl: true
      }
    })

    res.status(200).json({
      viewers: viewers.map(user => ({
        id: user.id,
        name: `${user.prenom} ${user.nom}`,
        avatar: user.avatar || user.avatarUrl,
        initials: getInitials(user)
      })),
      reactors: reactors.map(user => ({
        id: user.id,
        name: `${user.prenom} ${user.nom}`,
        avatar: user.avatar || user.avatarUrl,
        initials: getInitials(user)
      }))
    })

  } catch (error) {
    console.error('Error fetching engagement users:', error)
    res.status(500).json({ message: 'Internal server error' })
  }
}

function getInitials(user) {
  const first = user.prenom ? user.prenom[0] : ''
  const last = user.nom ? user.nom[0] : ''
  return (first + last).toUpperCase() || 'U'
}