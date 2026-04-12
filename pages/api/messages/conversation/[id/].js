import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export default async function handler(req, res) {
  const { id } = req.query

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  if (!id) {
    return res.status(400).json({ error: 'Conversation ID is required' })
  }

  try {
    const messages = await prisma.message.findMany({
      where: {
        conversationId: id
      },
      orderBy: {
        createdAt: 'asc'
      }
    })

    res.status(200).json({
      messages: messages.map(msg => ({
        id: msg.id,
        conversationId: msg.conversationId,
        senderEmail: msg.senderEmail,
        senderName: msg.senderName,
        text: msg.text,
        attachments: msg.attachments,
        reactions: msg.reactions,
        replyToId: msg.replyToId,
        isRead: msg.isRead,
        readAt: msg.readAt,
        createdAt: msg.createdAt,
        updatedAt: msg.updatedAt
      }))
    })
  } catch (error) {
    console.error('Error fetching messages:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}