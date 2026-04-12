import prisma from '../../../../lib/prisma'

export default async function handler(req, res) {
  const { id } = req.query

  if (!id) {
    return res.status(400).json({ error: 'Story ID required' })
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const story = await prisma.story.findUnique({
      where: { id },
      select: {
        id: true,
        views: true,
        likes: true,
        likedBy: true,
        reactions: true,
      },
    })

    if (!story) {
      return res.status(404).json({ error: 'Story not found' })
    }

    // Parse reaction types from reactions field
    let reactionTypes = {}
    if (story.reactions) {
      try {
        const reactions = JSON.parse(story.reactions)
        reactions.forEach(reaction => {
          if (reaction.type) {
            reactionTypes[reaction.type] = (reactionTypes[reaction.type] || 0) + 1
          }
        })
      } catch (e) {
        console.error('Error parsing reactions:', e)
      }
    }

    // If no reactions in reactions field, try to infer from likedBy
    if (Object.keys(reactionTypes).length === 0 && story.likedBy) {
      try {
        const likedBy = JSON.parse(story.likedBy)
        if (likedBy.length > 0) {
          reactionTypes['like'] = likedBy.length
        }
      } catch (e) {
        console.error('Error parsing likedBy:', e)
      }
    }

    return res.status(200).json({
      viewsCount: story.views || 0,
      reactionsCount: story.likes || 0,
      reactionTypes: reactionTypes,
    })
  } catch (error) {
    console.error('Error fetching story stats:', error)
    return res.status(500).json({ error: 'Failed to fetch story stats' })
  }
}
