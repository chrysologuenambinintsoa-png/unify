import prisma from '../../../lib/prisma'
import { createNotification } from '../../../lib/notifications'

export default async function handler(req, res) {
  const { id } = req.query
  const userStr = req.headers['x-user-id']

  if (!id) {
    return res.status(400).json({ error: 'Story ID required' })
  }

  // GET story details
  if (req.method === 'GET') {
    try {
      const story = await prisma.story.findUnique({
        where: { id },
        include: {
          author: {
            select: {
              id: true,
              prenom: true,
              nom: true,
              email: true,
              avatarUrl: true,
              avatar: true,
            },
          },
        },
      })

      if (!story) {
        return res.status(404).json({ error: 'Story not found' })
      }

      // Check if user has already viewed this story
      let shouldIncrementViews = false
      let userId = null
      
      if (userStr) {
        try {
          const user = typeof userStr === 'string' ? JSON.parse(userStr) : userStr
          userId = String(user.id)
          const viewedBy = story.viewedBy ? JSON.parse(story.viewedBy) : []
          
          if (!viewedBy.includes(userId)) {
            // User hasn't viewed this story yet
            shouldIncrementViews = true
            viewedBy.push(userId)
          }
        } catch (e) {
          // If parsing fails, allow view increment
          shouldIncrementViews = true
        }
      } else {
        // No user info, increment views (anonymous view)
        shouldIncrementViews = true
      }

      // Increment views only if user hasn't seen it before
      let updatedStory
      if (shouldIncrementViews) {
        const updateData = { views: { increment: 1 } }
        if (userId) {
          const currentViewedBy = story.viewedBy ? JSON.parse(story.viewedBy) : []
          updateData.viewedBy = JSON.stringify([...currentViewedBy, userId])
        }
        
        updatedStory = await prisma.story.update({
          where: { id },
          data: updateData,
          include: {
            author: {
              select: {
                id: true,
                prenom: true,
                nom: true,
                email: true,
                avatarUrl: true,
                avatar: true,
              },
            },
          },
        })
      } else {
        updatedStory = story
      }

      return res.status(200).json(updatedStory)
    } catch (error) {
      console.error('Error fetching story:', error)
      return res.status(500).json({ error: 'Failed to fetch story' })
    }
  }

  // POST like/unlike/share
  if (req.method === 'POST') {
    const { action } = req.body

    if (!userStr) {
      return res.status(401).json({ error: 'Not authenticated' })
    }

    try {
      let user
      try {
        user = typeof userStr === 'string' ? JSON.parse(userStr) : userStr
      } catch {
        return res.status(400).json({ error: 'Invalid user data' })
      }

      const story = await prisma.story.findUnique({ where: { id } })
      if (!story) {
        return res.status(404).json({ error: 'Story not found' })
      }

      if (action === 'like' || action === 'react') {
        const likedBy = story.likedBy ? JSON.parse(story.likedBy) : []
        const userIdStr = String(user.id)
        const reactionType = req.body.reactionType || 'like'

        if (likedBy.includes(userIdStr)) {
          // Unlike/Unreact
          const updated = await prisma.story.update({
            where: { id },
            data: {
              likes: Math.max(0, story.likes - 1),
              likedBy: JSON.stringify(likedBy.filter((uid) => uid !== userIdStr)),
            },
          })
          return res.status(200).json({ likes: updated.likes, liked: false, reactionType: null })
        } else {
          // Like/React
          const updated = await prisma.story.update({
            where: { id },
            data: {
              likes: story.likes + 1,
              likedBy: JSON.stringify([...likedBy, userIdStr]),
            },
          })
          // notify author
          try {
            if (story.authorId && story.authorId !== user.id) {
              await createNotification({
                userId: story.authorId,
                type: 'like',
                actorId: user.id,
                content: `a réagi à votre story avec ${reactionType}`,
                url: `/stories/${id}`
              })
            }
          } catch (e) {
            console.error('failed to create story reaction notification', e)
          }
          return res.status(200).json({ likes: updated.likes, liked: true, reactionType: reactionType })
        }
      }

      if (action === 'share') {
        const updated = await prisma.story.update({
          where: { id },
          data: { shares: story.shares + 1 },
        })
        return res.status(200).json({ shares: updated.shares })
      }

      return res.status(400).json({ error: 'Invalid action' })
    } catch (error) {
      console.error('Error updating story:', error)
      return res.status(500).json({ error: 'Failed to update story' })
    }
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
