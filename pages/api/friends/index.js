import prisma from '../../../lib/prisma'

export default async function handler(req, res) {
  const { method } = req
  const { userEmail } = req.query

  try {
    if (method === 'GET') {
      // Get friends of a user
      if (!userEmail) return res.status(400).json({ error: 'userEmail required' })

      const user = await prisma.user.findUnique({
        where: { email: userEmail },
        include: {
          friendsOf: { include: { friend: true } },
          friendsWith: { include: { user: true } }
        }
      })

      if (!user) return res.status(404).json({ error: 'User not found' })

      const friends = [
        ...user.friendsOf.map(f => ({ id: f.friend.id, email: f.friend.email, prenom: f.friend.prenom, nom: f.friend.nom })),
        ...user.friendsWith.map(f => ({ id: f.user.id, email: f.user.email, prenom: f.user.prenom, nom: f.user.nom }))
      ]

      return res.status(200).json({ friends })
    }

    res.setHeader('Allow', ['GET'])
    res.status(405).end(`Method ${method} Not Allowed`)
  } catch (err) {
    console.error('Friends API error', err)
    res.status(500).json({ error: err.message })
  }
}
