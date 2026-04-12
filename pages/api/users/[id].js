import prisma from '../../../lib/prisma'

export default async function handler(req, res) {
  const { id } = req.query
  const method = req.method

  if (method === 'GET') {
    try {
      const user = await prisma.user.findUnique({ where: { email: id } })
      if (!user) return res.status(404).json({ error: 'User not found' })
      return res.status(200).json(user)
    } catch (err) {
      console.error('Get user error', err)
      return res.status(500).json({ error: err.message })
    }
  }

  if (method === 'PUT') {
    try {
      const data = req.body
      const user = await prisma.user.update({ where: { email: id }, data })
      return res.status(200).json(user)
    } catch (err) {
      console.error('Update user error', err)
      return res.status(500).json({ error: err.message })
    }
  }

  res.setHeader('Allow', ['GET','PUT'])
  res.status(405).end(`Method ${method} Not Allowed`)
}
