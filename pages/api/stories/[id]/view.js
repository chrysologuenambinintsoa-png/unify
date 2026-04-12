import prisma from '../../../../lib/prisma'

export default async function handler(req, res) {
  const { id } = req.query
  const userStr = req.headers['x-user-id']

  if (!id) {
    return res.status(400).json({ error: 'Story ID required' })
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const story = await prisma.story.findUnique({
      where: { id },
      select: {
        id: true,
        views: true,
        viewedBy: true,
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
        select: {
          id: true,
          views: true,
        },
      })
    } else {
      updatedStory = story
    }

    return res.status(200).json({
      viewsCount: updatedStory.views || 0,
      alreadyViewed: !shouldIncrementViews,
    })
  } catch (error) {
    console.error('Error updating story views:', error)
    return res.status(500).json({ error: 'Failed to update story views' })
  }
}
