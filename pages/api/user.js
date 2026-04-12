import prisma from '../../lib/prisma'

export default async function handler(req, res) {
  // simple user profile/settings endpoint
  const { method } = req
  const userEmail = req.query?.userEmail || req.body?.userEmail
  const rawUserId = req.query?.userId || req.body?.userId
  const userId = rawUserId !== undefined ? parseInt(rawUserId, 10) : undefined
  if (!userEmail && !userId) {
    // if no identifier provided attempt to return a default user (first record)
    try {
      const defaultUser = await prisma.user.findFirst()
      if (defaultUser) {
        const parsedSettings = defaultUser.settings ? JSON.parse(defaultUser.settings) : {}
        const safe = {
          id: defaultUser.id,
          email: defaultUser.email,
          prenom: defaultUser.prenom,
          nom: defaultUser.nom,
          nomUtilisateur: defaultUser.nomUtilisateur,
          phone: defaultUser.phone,
          dateNaissance: defaultUser.dateNaissance,
          genre: defaultUser.genre,
          avatar: defaultUser.avatar,
          avatarUrl: defaultUser.avatarUrl,
          cover: defaultUser.cover,
          ...parsedSettings
        }
        return res.status(200).json({ user: safe })
      }
    } catch (err) {
      console.error('user API default fetch error', err)
    }

    return res.status(400).json({ error: 'userEmail or userId required' })
  }
  if (rawUserId !== undefined && isNaN(userId)) {
    return res.status(400).json({ error: 'userId must be a number' })
  }

  try {
    if (method === 'GET') {
      let user
      if (userId) {
        user = await prisma.user.findUnique({ where: { id: userId } })
      } else {
        user = await prisma.user.findUnique({ where: { email: userEmail } })
      }
      if (!user) return res.status(404).json({ error: 'User not found' })
      // exclude passwordHash
      const parsedSettings = user.settings ? JSON.parse(user.settings) : {}
      const safe = {
        id: user.id,
        email: user.email,
        prenom: user.prenom,
        nom: user.nom,
        nomUtilisateur: user.nomUtilisateur,
        phone: user.phone,
        dateNaissance: user.dateNaissance,
        genre: user.genre,
        avatar: user.avatar,
        avatarUrl: user.avatarUrl,
        cover: user.cover,
        ...parsedSettings // spread settings fields
      }
      return res.status(200).json({ user: safe })
    } else if (method === 'PUT') {
      const updates = {}
      // allow updating general profile fields (include avatar/cover fields)
      const profileFields = ['prenom', 'nom', 'nomUtilisateur', 'phone', 'dateNaissance', 'genre', 'avatar', 'avatarUrl', 'cover']
      profileFields.forEach(f => {
        if (req.body[f] !== undefined) {
          updates[f] = req.body[f]
        }
      })
      // handle about fields that go into settings
      const aboutFields = ['metier', 'ecole', 'ville', 'originaire', 'relation', 'membre']
      let settingsUpdate = false
      aboutFields.forEach(f => {
        if (req.body[f] !== undefined) {
          settingsUpdate = true
        }
      })
      if (settingsUpdate) {
        // get current user to merge settings
        let currentUser
        if (userId) {
          currentUser = await prisma.user.findUnique({ where: { id: userId } })
        } else {
          currentUser = await prisma.user.findUnique({ where: { email: userEmail } })
        }
        if (!currentUser) return res.status(404).json({ error: 'User not found' })
        const currentSettings = currentUser.settings ? JSON.parse(currentUser.settings) : {}
        const newSettings = { ...currentSettings }
        aboutFields.forEach(f => {
          if (req.body[f] !== undefined) {
            newSettings[f] = req.body[f]
          }
        })
        updates.settings = JSON.stringify(newSettings)
      }
      // settings may be provided as object
      if (req.body.settings !== undefined) {
        updates.settings = req.body.settings
      }
      if (Object.keys(updates).length === 0) {
        return res.status(400).json({ error: 'No valid fields to update' })
      }
      let whereClause
      if (userId) {
        whereClause = { id: userId }
      } else {
        whereClause = { email: userEmail }
      }
      const updated = await prisma.user.update({ where: whereClause, data: updates })
      const parsedSettings = updated.settings ? JSON.parse(updated.settings) : {}
      const safe = {
        id: updated.id,
        email: updated.email,
        prenom: updated.prenom,
        nom: updated.nom,
        nomUtilisateur: updated.nomUtilisateur,
        phone: updated.phone,
        dateNaissance: updated.dateNaissance,
        genre: updated.genre,
        avatar: updated.avatar,
        avatarUrl: updated.avatarUrl,
        cover: updated.cover,
        ...parsedSettings // spread settings fields
      }
      return res.status(200).json({ user: safe })
    }
  } catch (err) {
    console.error('user API error', err)
    return res.status(500).json({ error: 'Internal server error' })
  }

  res.setHeader('Allow', ['GET', 'PUT'])
  return res.status(405).json({ error: `Method ${method} Not Allowed` })
}
