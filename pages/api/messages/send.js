import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { conversationId, senderEmail, senderName, text } = req.body

  if (!conversationId || !senderEmail || !senderName || !text) {
    return res.status(400).json({ error: 'Missing required fields' })
  }

  try {
    // Create the message
    const message = await prisma.message.create({
      data: {
        conversationId,
        senderEmail,
        senderName,
        text
      }
    })

    // Update conversation's updatedAt timestamp
    await prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() }
    })

    res.status(200).json({
      id: message.id,
      conversationId: message.conversationId,
      senderEmail: message.senderEmail,
      senderName: message.senderName,
      text: message.text,
      attachments: message.attachments,
      reactions: message.reactions,
      replyToId: message.replyToId,
      isRead: message.isRead,
      readAt: message.readAt,
      createdAt: message.createdAt,
      updatedAt: message.updatedAt
    })
  } catch (error) {
    console.error('Error sending message:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}