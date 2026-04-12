import prisma from '../../../lib/prisma'

export default async function handler(req, res) {
  const method = req.method
  if (method === 'GET') {
    try {
      const users = await prisma.user.findMany({ take: 100 })
      return res.status(200).json(users)
    } catch (err) {
      console.error('List users error', err)
      return res.status(500).json({ error: err.message })
    }
  }

  res.setHeader('Allow', ['GET'])
  res.status(405).end(`Method ${method} Not Allowed`)
}
