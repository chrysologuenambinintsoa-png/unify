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

        // Parse members list
        let membersList = []
        try {
          membersList = group.membersList ? JSON.parse(group.membersList) : []
        } catch (e) {
          console.error('Error parsing membersList:', e)
          membersList = []
        }

        return res.status(200).json({ 
          groupe: {
            ...group,
            membersList: membersList
          } 
        })

      case 'PUT':
        const { action, userEmail, avatar, cover } = req.body


        if (action === 'updateAvatar' && avatar) {
          // Le modèle Group n'a pas de champ avatar, on retourne une erreur explicite
          return res.status(400).json({ error: "Le groupe ne possède pas de champ 'avatar'. Utilisez 'cover' pour la couverture." })
        }

        if (action === 'updateCover' && cover) {
          const updated = await prisma.group.update({
            where: { id: parseInt(id) },
            data: { cover }
          })
          return res.status(200).json({ groupe: updated })
        }

        if (action === 'updatePrivacy') {
          return res.status(400).json({ error: 'Fonctionnalité non implémentée' })
        }

        return res.status(400).json({ error: 'Action non reconnue' })

      case 'DELETE':
        // Delete group
        await prisma.group.delete({
          where: { id: parseInt(id) }
        })
        return res.status(200).json({ message: 'Groupe supprimé avec succès' })

      default:
        res.setHeader('Allow', ['GET', 'PUT', 'DELETE'])
        return res.status(405).json({ error: `Méthode ${method} non autorisée` })
    }
  } catch (error) {
    console.error('Error in /api/groupes/[id]:', error)
    
    // Provide more specific error messages
    if (error.code === 'P2002') {
      return res.status(409).json({ error: 'Conflit de données' })
    }
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Groupe non trouvé' })
    }
    if (error.message && error.message.includes('prisma')) {
      return res.status(503).json({ error: 'Service de base de données temporairement indisponible' })
    }
    return res.status(500).json({ error: 'Erreur serveur' })
  }
}