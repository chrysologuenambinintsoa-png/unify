import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { participants, participantNames, title, avatar, initialMessage } = req.body

  if (!participants || !participantNames || participants.length < 2) {
    return res.status(400).json({ error: 'At least two participants are required' })
  }

  try {
    // Check if a conversation already exists between these participants
    const existingConversation = await prisma.conversation.findFirst({
      where: {
        participants: {
          equals: JSON.stringify(participants.sort()) // Sort to ensure consistent ordering
        }
      }
    })

    if (existingConversation) {
      return res.status(200).json({
        conversation: existingConversation,
        existed: true
      })
    }

    // Create new conversation
    const conversation = await prisma.conversation.create({
      data: {
        participants: JSON.stringify(participants.sort()),
        participantNames: JSON.stringify(participantNames),
        title,
        avatar
      }
    })

    // If there's an initial message, create it
    let message = null
    if (initialMessage) {
      message = await prisma.message.create({
        data: {
          conversationId: conversation.id,
          senderEmail: initialMessage.senderEmail,
          senderName: initialMessage.senderName,
          text: initialMessage.text
        }
      })
    }

    res.status(201).json({
      conversation,
      message,
      existed: false
    })
  } catch (error) {
    console.error('Error creating conversation:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}