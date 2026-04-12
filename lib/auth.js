import jwt from 'jsonwebtoken'
import prisma from './prisma'

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret'

export const authOptions = {
  secret: JWT_SECRET,
}

export async function getServerSession(options) {
  // Stub function for compatibility with next-auth pattern
  // Since the project uses custom JWT auth, return null
  return null
}

export async function verifyToken(token) {
  try {
    const decoded = jwt.verify(token, JWT_SECRET)
    return decoded
  } catch (err) {
    return null
  }
}

export async function getUserFromToken(token) {
  const decoded = await verifyToken(token)
  if (!decoded || !decoded.userId) return null

  const user = await prisma.user.findUnique({
    where: { id: decoded.userId },
  })
  return user
}
