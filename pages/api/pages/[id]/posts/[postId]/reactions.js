import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export default async function handler(req, res) {
  const { id: pageId, postId } = req.query
  const parsedPostId = parseInt(postId, 10)
  
  if (Number.isNaN(parsedPostId)) {
    return res.status(400).json({ error: 'Invalid post id' })
  }

  if (req.method === 'GET') {
    try {
      const post = await prisma.pagePost.findUnique({ where: { id: parsedPostId } })
      if (!post) {
        return res.status(404).json({ error: 'Post not found' })
      }
      
      let reactions = []
      if (typeof post.reactions === 'string') {
        try {
          reactions = JSON.parse(post.reactions)
        } catch (e) {
          reactions = []
        }
      } else if (Array.isArray(post.reactions)) {
        reactions = post.reactions
      }
      
      return res.json({ 
        count: post.likes || 0, 
        likes: post.likes || 0,
        reactions 
      })
    } catch (e) {
      console.error('page post reactions GET error', e)
      return res.status(500).json({ error: 'Internal server error' })
    }
  }

  if (req.method === 'POST') {
    try {
      const { action, userEmail } = req.body
      
      if (!action) {
        return res.status(400).json({ error: 'action is required' })
      }

      const existingPost = await prisma.pagePost.findUnique({ where: { id: parsedPostId } })
      if (!existingPost) {
        return res.status(404).json({ error: 'Post not found' })
      }

      let existingReactions = []
      if (typeof existingPost.reactions === 'string') {
        try {
          existingReactions = JSON.parse(existingPost.reactions)
        } catch (e) {
          existingReactions = []
        }
      } else if (Array.isArray(existingPost.reactions)) {
        existingReactions = existingPost.reactions
      }

      let newReactions = [...existingReactions]
      let newLikes = existingPost.likes || 0

      const reactionTypes = ['like', 'love', 'haha', 'wow', 'sad', 'angry']
      
      if (reactionTypes.includes(action)) {
        newReactions.push(action)
        newLikes += 1
        
        const updated = await prisma.pagePost.update({
          where: { id: parsedPostId },
          data: { 
            likes: newLikes,
            reactions: JSON.stringify(newReactions)
          }
        })
        return res.json({ 
          likes: updated.likes,
          reactions: newReactions
        })
      }
      
      if (action === 'unlike') {
        if (newReactions.length > 0) {
          newReactions.pop()
        }
        newLikes = Math.max(0, newLikes - 1)
        
        const updated = await prisma.pagePost.update({
          where: { id: parsedPostId },
          data: { 
            likes: newLikes,
            reactions: JSON.stringify(newReactions)
          }
        })
        return res.json({ 
          likes: updated.likes,
          reactions: newReactions
        })
      }

      return res.status(400).json({ error: 'unknown action' })
    } catch (e) {
      console.error('page post reactions POST error', e)
      return res.status(500).json({ error: 'Internal server error' })
    }
  }

  res.setHeader('Allow', ['GET', 'POST'])
  res.status(405).end(`Method ${req.method} Not Allowed`)
}