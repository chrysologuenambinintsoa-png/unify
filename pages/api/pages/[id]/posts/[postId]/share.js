import prisma from '../../../../../../lib/prisma'

export default async function handler(req, res) {
  const { id, postId } = req.query
  const pageId = parseInt(id, 10)
  const postIdNum = parseInt(postId, 10)

  if (Number.isNaN(pageId) || Number.isNaN(postIdNum)) {
    return res.status(400).json({ error: 'Invalid id' })
  }

  if (req.method === 'POST') {
    try {
      const { type, to, senderEmail, senderName } = req.body

      if (type === 'friend' && to) {
        await prisma.notification.create({
          data: {
            type: 'share',
            userEmail: to,
            message: `${senderName || 'Quelqu\'un'} a partagé une publication avec vous`,
            link: `/pages/${pageId}/posts/${postIdNum}`,
          }
        }).catch(() => {})

        const shareUrl = `${process.env.NEXT_PUBLIC_APP_URL || ''}/pages/${pageId}/posts/${postIdNum}`
        
        const participants = [senderEmail, to].sort()
        const participantNames = JSON.stringify({
          [senderEmail]: senderName || 'Vous',
          [to]: to
        })

        const conversation = await prisma.conversation.findFirst({
          where: { participants: { equals: JSON.stringify(participants) } }
        })

        if (conversation) {
          await prisma.message.create({
            data: {
              conversationId: conversation.id,
              senderEmail: senderEmail,
              senderName: senderName || 'Vous',
              text: `Voici une publication partagée: ${shareUrl}`
            }
          })
          await prisma.conversation.update({
            where: { id: conversation.id },
            data: { updatedAt: new Date() }
          })
        } else {
          const newConv = await prisma.conversation.create({
            data: {
              participants: JSON.stringify(participants),
              participantNames,
              title: to.split('@')[0]
            }
          })
          await prisma.message.create({
            data: {
              conversationId: newConv.id,
              senderEmail: senderEmail,
              senderName: senderName || 'Vous',
              text: `Voici une publication partagée: ${shareUrl}`
            }
          })
        }
      }

      if (type === 'group' && to) {
        const shareUrl = `${process.env.NEXT_PUBLIC_APP_URL || ''}/pages/${pageId}/posts/${postIdNum}`
        
        const groupPost = await prisma.groupPost.create({
          data: {
            groupId: to,
            content: `Publication partagée: ${shareUrl}`,
            pagePostId: postIdNum,
            authorEmail: senderEmail
          }
        }).catch(async () => {
          return await prisma.group.update({
            where: { id: to },
            data: { 
              lastPost: `Publication partagée: ${shareUrl}`,
              lastPostAt: new Date()
            }
          })
        })
      }

      const updated = await prisma.pagePost.update({
        where: { id: postIdNum },
        data: { shares: { increment: 1 } }
      }).catch(async () => {
        return await prisma.post.update({
          where: { id: postIdNum },
          data: { shares: { increment: 1 } }
        })
      })

      return res.json({ shares: updated.shares || 0 })
    } catch (e) {
      console.error('share POST error', e)
      return res.status(500).json({ error: 'Internal server error' })
    }
  }

  if (req.method === 'GET') {
    try {
      const post = await prisma.pagePost.findUnique({
        where: { id: postIdNum },
        select: { shares: true }
      }).catch(async () => {
        return await prisma.post.findUnique({
          where: { id: postIdNum },
          select: { shares: true }
        })
      })

      return res.json({ shares: post?.shares || 0 })
    } catch (e) {
      console.error('share GET error', e)
      return res.status(500).json({ error: 'Internal server error' })
    }
  }

  res.setHeader('Allow', ['POST', 'GET'])
  res.status(405).end(`Method ${req.method} Not Allowed`)
}
