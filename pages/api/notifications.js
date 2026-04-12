import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export default async function handler(req, res) {
  const { userEmail } = req.query

  // GET - Fetch notifications
  if (req.method === 'GET') {
    if (!userEmail) {
      return res.status(400).json({ error: 'userEmail is required' })
    }

    try {
      // Find the user by email
      const user = await prisma.user.findUnique({
        where: { email: userEmail }
      })

      if (!user) {
        return res.status(404).json({ error: 'User not found' })
      }

      // Fetch notifications for the user, ordered by creation date (newest first)
      const notifications = await prisma.notification.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' },
        take: 50
      })

      return res.status(200).json(notifications)
    } catch (error) {
      console.error('Error fetching notifications:', error)
      return res.status(500).json({ error: 'Internal server error' })
    }
  }

  // PUT - Mark notifications as read
  if (req.method === 'PUT') {
    const { all, id, read, userEmail: bodyUserEmail } = req.body

    try {
      const userEmailToUse = bodyUserEmail || userEmail
      
      if (!userEmailToUse) {
        return res.status(400).json({ error: 'userEmail is required' })
      }

      const user = await prisma.user.findUnique({
        where: { email: userEmailToUse }
      })

      if (!user) {
        return res.status(404).json({ error: 'User not found' })
      }

      if (all) {
        // Mark all notifications as read
        await prisma.notification.updateMany({
          where: { userId: user.id, read: false },
          data: { read: true }
        })
      } else if (id) {
        // Mark single notification as read
        await prisma.notification.update({
          where: { id },
          data: { read }
        })
      }

      return res.status(200).json({ success: true })
    } catch (error) {
      console.error('Error updating notifications:', error)
      return res.status(500).json({ error: 'Internal server error' })
    }
  }

  // DELETE - Delete notifications
  if (req.method === 'DELETE') {
    const { id, userEmail: bodyUserEmail } = req.body

    try {
      const userEmailToUse = bodyUserEmail || userEmail
      
      if (!userEmailToUse) {
        return res.status(400).json({ error: 'userEmail is required' })
      }

      const user = await prisma.user.findUnique({
        where: { email: userEmailToUse }
      })

      if (!user) {
        return res.status(404).json({ error: 'User not found' })
      }

      if (id) {
        // Delete single notification
        await prisma.notification.delete({
          where: { id }
        })
      }

      return res.status(200).json({ success: true })
    } catch (error) {
      console.error('Error deleting notification:', error)
      return res.status(500).json({ error: 'Internal server error' })
    }
  }

  // Method not allowed
  return res.status(405).json({ error: 'Method not allowed' })
}
