import { getUserFromToken } from '../../lib/auth'

export default async function handler(req, res) {
  const authHeader = req.headers.authorization || req.headers.Authorization
  if (!authHeader) return res.status(401).json({ error: 'Unauthorized' })
  const token = authHeader.replace(/^Bearer\s+/i, '')
  const user = await getUserFromToken(token)
  if (!user) return res.status(401).json({ error: 'Invalid token' })

  // safe user object
  const safeUser = { id: user.id, email: user.email, prenom: user.prenom, nom: user.nom, nomUtilisateur: user.nomUtilisateur, isApprovedSeller: user.isApprovedSeller, avatar: user.avatar, avatarUrl: user.avatarUrl, cover: user.cover }
  return res.status(200).json({ user: safeUser })
}
