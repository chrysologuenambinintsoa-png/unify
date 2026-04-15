import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export default async function handler(req, res) {
  const { id: pageId, postId, commentId } = req.query
  const parsedPostId = parseInt(postId, 10)
  const parsedCommentId = parseInt(commentId, 10)
  
  if (Number.isNaN(parsedPostId) || Number.isNaN(parsedCommentId)) {
    return res.status(400).json({ error: 'Invalid id' })
  }

  if (req.method === 'POST') {
    try {
      const { action, userEmail } = req.body
      
      if (!action || !userEmail) {
        return res.status(400).json({ error: 'action and userEmail are required' })
      }

      const comment = await prisma.pagePostComment.findUnique({ where: { id: parsedCommentId } })
      if (!comment) {
        return res.status(404).json({ error: 'Comment not found' })
      }

      let likedBy = []
      if (comment.likedBy) {
        try {
          likedBy = JSON.parse(comment.likedBy)
        } catch (e) {
          likedBy = []
        }
      }

      const hasLiked = likedBy.includes(userEmail)

      if (action === 'like' && !hasLiked) {
        likedBy.push(userEmail)
        await prisma.pagePostComment.update({
          where: { id: parsedCommentId },
          data: { 
            likes: { increment: 1 },
            likedBy: JSON.stringify(likedBy)
          }
        })
      } else if (action === 'unlike' && hasLiked) {
        likedBy = likedBy.filter(e => e !== userEmail)
        await prisma.pagePostComment.update({
          where: { id: parsedCommentId },
          data: { 
            likes: { decrement: 1 },
            likedBy: JSON.stringify(likedBy)
          }
        })
      }

      return res.json({ success: true })
    } catch (e) {
      console.error('page post comment reactions POST error', e)
      return res.status(500).json({ error: 'Internal server error' })
    }
  }

  res.setHeader('Allow', ['POST'])
  res.status(405).end(`Method ${req.method} Not Allowed`)
}
