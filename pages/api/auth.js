import prisma from '../../lib/prisma'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { createNotification } from '../../lib/notifications'

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST'])
    return res.status(405).end(`Method ${req.method} Not Allowed`)
  }

  const { action } = req.body

  if (action === 'register') {
    const { email, password, prenom, nom, nomUtilisateur } = req.body.userData || {}
    if (!email || !password) return res.status(400).json({ error: 'Email et mot de passe requis' })

    try {
      const existing = await prisma.user.findUnique({ where: { email } })
      if (existing) return res.status(409).json({ error: 'Utilisateur déjà existant' })

      const hash = await bcrypt.hash(password, 10)
      const user = await prisma.user.create({ data: {
        email,
        passwordHash: hash,
        prenom: prenom || null,
        nom: nom || null,
        nomUtilisateur: nomUtilisateur || null
      }})

      const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' })
      let avatar = null
      try {
        if (user.photos) {
          const parsed = JSON.parse(user.photos)
          if (Array.isArray(parsed) && parsed.length > 0) avatar = parsed[0]
        }
      } catch (e) {
        // ignore parse errors, leave avatar null
      }
      const safeUser = { id: user.id, email: user.email, prenom: user.prenom, nom: user.nom, nomUtilisateur: user.nomUtilisateur, avatar, avatarUrl: user.avatarUrl, cover: user.cover }
      // welcome notification
      try {
        await createNotification({
          userId: user.id,
          type: 'login',
          content: 'Bienvenue sur Unify !',
          url: '/'
        })
      } catch (e) {
        console.error('welcome notification failed', e)
      }
      return res.status(201).json({ success: true, token, user: safeUser })
    } catch (err) {
      console.error('Register error', err)
      return res.status(500).json({ error: 'Erreur serveur' })
    }
  }

  if (action === 'login') {
    const { email, password } = req.body
    if (!email || !password) return res.status(400).json({ error: 'Email et mot de passe requis' })

    try {
      const user = await prisma.user.findUnique({ where: { email } })
      if (!user) return res.status(401).json({ error: 'Utilisateur non trouvé' })

      const ok = await bcrypt.compare(password, user.passwordHash)
      if (!ok) return res.status(401).json({ error: 'Mot de passe invalide' })

      const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' })
      let avatar = null
      try {
        if (user.photos) {
          const parsed = JSON.parse(user.photos)
          if (Array.isArray(parsed) && parsed.length > 0) avatar = parsed[0]
        }
      } catch (e) {
        // ignore parse errors, leave avatar null
      }
      const safeUser = { id: user.id, email: user.email, prenom: user.prenom, nom: user.nom, nomUtilisateur: user.nomUtilisateur, avatar, avatarUrl: user.avatarUrl, cover: user.cover }
      // small login notification (optional)
      try {
        await createNotification({
          userId: user.id,
          type: 'login',
          content: 'Connexion réussie',
          url: '/'
        })
      } catch (e) {
        console.error('login notification failed', e)
      }
      return res.status(200).json({ success: true, token, user: safeUser })
    } catch (err) {
      console.error('Login error', err)
      return res.status(500).json({ error: 'Erreur serveur' })
    }
  }

  return res.status(400).json({ error: 'Action non valide' })
}
