// API endpoint for fetching test conversations from memory
// Used by the test flow to retrieve pre-initialized conversations

export default function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET'])
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { userEmail } = req.query

    if (!userEmail) {
      return res.status(400).json({ error: 'userEmail parameter required' })
    }

    // Get test conversations from global memory
    if (!global.testConversations || global.testConversations.length === 0) {
      return res.status(200).json([])
    }

    // Filter for current user
    const userConversations = global.testConversations.filter(conv => {
      const participants = JSON.parse(conv.participants)
      return participants.includes(userEmail)
    })

    // Format for frontend  
    const formattedConversations = userConversations.map(conv => {
      const participants = JSON.parse(conv.participants)
      const otherParticipant = participants.find(p => p !== userEmail)
      const messages = (conv.messages || []).map(m => ({
        ...m,
        attachments: m.attachments || null,
        type: m.type || 'text'
      }))
      const lastMessage = messages[messages.length - 1]

      return {
        id: conv.id,
        title: conv.title || otherParticipant || 'Conversation',
        avatar: conv.avatar || (otherParticipant ? otherParticipant[0].toUpperCase() : '?'),
        lastMessage: lastMessage?.text || 'Aucun message',
        lastMessageTime: lastMessage?.createdAt || conv.updatedAt,
        lastMessageSender: lastMessage?.senderName,
        unreadCount: messages.filter(m => !m.isRead && m.senderEmail !== userEmail).length,
        messages: messages || [],
        participants,
        createdAt: conv.createdAt
      }
    }).sort((a, b) => new Date(b.lastMessageTime) - new Date(a.lastMessageTime))

    return res.status(200).json(formattedConversations)
  } catch (error) {
    console.error('Error fetching test conversations:', error)
    return res.status(500).json({ error: error.message })
  }
}
