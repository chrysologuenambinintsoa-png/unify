import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export default async function handler(req, res) {
  const { method } = req
  const { id } = req.query

  try {
    switch (method) {
      case 'GET':
        const group = await prisma.group.findUnique({
          where: { id: parseInt(id) }
        })
        
        if (!group) return res.status(404).json({ error: 'Groupe non trouvé' })
        
        let membersList = []
        try {
          membersList = group.membersList ? JSON.parse(group.membersList) : []
        } catch (e) {
          console.error('Error parsing membersList:', e)
          membersList = []
        }
        
        const members = []
        for (const email of membersList) {
          const user = await prisma.user.findUnique({
            where: { email }
          })
          if (user) {
            members.push({
              id: user.id,
              name: `${user.prenom || ''} ${user.nom || ''}`.trim() || user.email,
              avatar: user.avatar || user.avatarUrl || '/api/placeholder/40/40',
              role: 'member'
            })
          }
        }

        return res.status(200).json({ members })

      default:
        res.setHeader('Allow', ['GET'])
        return res.status(405).json({ error: `Méthode ${method} non autorisée` })
    }
  } catch (error) {
    console.error(error)
    return res.status(500).json({ error: 'Erreur serveur' })
  }
}