import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { userEmail } = req.query

  if (!userEmail) {
    return res.status(400).json({ error: 'User email is required' })
  }

  try {
    // Find all conversations where the user is a participant
    const conversations = await prisma.conversation.findMany({
      where: {
        participants: {
          contains: userEmail
        }
      },
      include: {
        messages: {
          orderBy: {
            createdAt: 'desc'
          },
          take: 1 // Get the latest message
        }
      },
      orderBy: {
        updatedAt: 'desc'
      }
    })

    // Format conversations for the frontend
    const formattedConversations = conversations.map(conv => {
      const participants = JSON.parse(conv.participants)
      const participantNames = JSON.parse(conv.participantNames || '[]')
      const lastMessage = conv.messages[0]

      return {
        id: conv.id,
        participants: conv.participants,
        participantNames: conv.participantNames,
        title: conv.title,
        avatar: conv.avatar,
        createdAt: conv.createdAt,
        updatedAt: conv.updatedAt,
        lastMessage: lastMessage ? lastMessage.text : null,
        lastMessageTime: lastMessage ? lastMessage.createdAt : conv.createdAt
      }
    })

    res.status(200).json({
      conversations: formattedConversations
    })
  } catch (error) {
    console.error('Error fetching conversations:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}