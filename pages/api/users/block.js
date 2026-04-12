import prisma from '../../../lib/prisma'

export default async function handler(req, res) {
  const { method } = req

  if (method === 'POST') {
    return handleBlockUser(req, res)
  } else if (method === 'DELETE') {
    return handleUnblockUser(req, res)
  } else if (method === 'GET') {
    return handleGetBlockedUsers(req, res)
  } else {
    res.setHeader('Allow', ['GET', 'POST', 'DELETE'])
    return res.status(405).json({ error: `Method ${method} Not Allowed` })
  }
}

async function handleBlockUser(req, res) {
  try {
    const { userEmail, blockedUserId } = req.body

    if (!userEmail || !blockedUserId) {
      return res.status(400).json({ error: 'userEmail et blockedUserId sont requis' })
    }

    // Récupérer les utilisateurs
    const user = await prisma.user.findUnique({ where: { email: userEmail } })
    const blockedUser = await prisma.user.findUnique({ where: { id: parseInt(blockedUserId) } })

    if (!user || !blockedUser) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' })
    }

    if (user.id === blockedUser.id) {
      return res.status(400).json({ error: 'Vous ne pouvez pas vous bloquer vous-même' })
    }

    // Récupérer les settings actuels de l'utilisateur
    let settings = {}
    try {
      settings = user.settings ? JSON.parse(user.settings) : {}
    } catch (e) {
      settings = {}
    }

    // Initialiser blocking.blockedUsers s'il n'existe pas
    if (!settings.blocking) {
      settings.blocking = {}
    }
    if (!settings.blocking.blockedUsers) {
      settings.blocking.blockedUsers = []
    }

    // Ajouter l'utilisateur à la liste noire s'il n'y est pas déjà
    if (!settings.blocking.blockedUsers.includes(blockedUser.id)) {
      settings.blocking.blockedUsers.push(blockedUser.id)
    }

    // Mettre à jour les settings
    await prisma.user.update({
      where: { email: userEmail },
      data: { settings: JSON.stringify(settings) }
    })

    return res.status(200).json({
      success: true,
      message: `${blockedEmail} a été bloqué avec succès`
    })
  } catch (error) {
    console.error('Erreur lors du blocage:', error)
    return res.status(500).json({ error: error.message })
  }
}

async function handleUnblockUser(req, res) {
  try {
    const { userEmail, unblockedUserId } = req.body

    if (!userEmail || !unblockedUserId) {
      return res.status(400).json({ error: 'userEmail et unblockedUserId sont requis' })
    }

    const user = await prisma.user.findUnique({ where: { email: userEmail } })

    if (!user) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' })
    }

    // Récupérer les settings
    let settings = {}
    try {
      settings = user.settings ? JSON.parse(user.settings) : {}
    } catch (e) {
      settings = {}
    }

    if (!settings.blocking) {
      settings.blocking = {}
    }
    if (!settings.blocking.blockedUsers) {
      settings.blocking.blockedUsers = []
    }

    // Retirer de la liste noire
    settings.blocking.blockedUsers = settings.blocking.blockedUsers.filter(id => id !== parseInt(unblockedUserId))

    // Mettre à jour
    await prisma.user.update({
      where: { email: userEmail },
      data: { settings: JSON.stringify(settings) }
    })

    return res.status(200).json({
      success: true,
      message: `${unblockedEmail} a été débloqué`
    })
  } catch (error) {
    console.error('Erreur lors du déblocage:', error)
    return res.status(500).json({ error: error.message })
  }
}

async function handleGetBlockedUsers(req, res) {
  try {
    const { userEmail } = req.query

    if (!userEmail) {
      return res.status(400).json({ error: 'userEmail est requis' })
    }

    const user = await prisma.user.findUnique({ where: { email: userEmail } })

    if (!user) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' })
    }

    let settings = {}
    try {
      settings = user.settings ? JSON.parse(user.settings) : {}
    } catch (e) {
      settings = {}
    }

    const blockedUsers = settings.blocking?.blockedUsers || []

    return res.status(200).json({
      blockedUsers,
      count: blockedUsers.length
    })
  } catch (error) {
    console.error('Erreur lors de la récupération des utilisateurs bloqués:', error)
    return res.status(500).json({ error: error.message })
  }
}
