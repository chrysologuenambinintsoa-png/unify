import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export default async function handler(req, res) {
  const { method } = req
  const { id } = req.query

  try {
    switch (method) {
      case 'GET':
        const followers = await prisma.pageFollower.findMany({
          where: { pageId: id },
          include: { user: true }
        })

        const formattedFollowers = followers.map(f => ({
          id: f.user.id,
          name: `${f.user.prenom} ${f.user.nom}`,
          avatar: f.user.avatar
        }))

        return res.status(200).json({ followers: formattedFollowers })

      default:
        res.setHeader('Allow', ['GET'])
        return res.status(405).json({ error: `Méthode ${method} non autorisée` })
    }
  } catch (error) {
    console.error(error)
    return res.status(500).json({ error: 'Erreur serveur' })
  }
}