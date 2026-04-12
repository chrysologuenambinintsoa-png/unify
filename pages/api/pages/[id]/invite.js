import { PrismaClient } from '@prisma/client'
import jwt from 'jsonwebtoken'

const prisma = new PrismaClient()
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret'

async function getUser(req) {
  // Try JWT from Authorization header first
  const authHeader = req.headers.authorization
  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      const token = authHeader.split(' ')[1]
      const decoded = jwt.verify(token, JWT_SECRET)
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId || decoded.sub }
      })
      if (user) return user
    } catch (err) {
      console.log('JWT verification failed:', err.message)
    }
  }
  
  // Fallback to query param for testing
  const userEmail = req.query.userEmail
  if (userEmail) {
    const user = await prisma.user.findUnique({ where: { email: userEmail } })
    if (user) return user
  }
  
  return null
}

export default async function handler(req, res) {
  const { id: pageId } = req.query
  const { method } = req

  try {
    const user = await getUser(req)
    if (!user) return res.status(401).json({ error: 'Non autorisé' })

    if (method === 'POST') {
      const { email } = req.body
      if (!email) return res.status(422).json({ error: 'Email requis' })

      // Check if already member
      const existing = await prisma.pageMember.findUnique({
        where: { pageId_userEmail: { pageId: parseInt(pageId), userEmail: email } }
      })

      if (!existing) {
        await prisma.pageMember.create({
          data: {
            pageId: parseInt(pageId),
            userEmail: email,
            role: 'member'
          }
        })
      }

      return res.status(200).json({ success: true, message: `Invitation envoyée à ${email}` })
    }

    res.setHeader('Allow', ['POST'])
    return res.status(405).json({ error: 'Méthode non autorisée' })
  } catch (error) {
    console.error('Page invite API error:', error)
    res.status(500).json({ error: error.message })
  }
}
