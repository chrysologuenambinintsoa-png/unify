import prisma from '../../lib/prisma'

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET'])
    return res.status(405).end(`Method ${req.method} Not Allowed`)
  }

  try {
    // Get counts from database
    const [userCount, postCount, communityCount] = await Promise.all([
      prisma.user.count(),
      prisma.item.count(),
      prisma.group.count()
    ])

    return res.status(200).json({
      users: userCount,
      posts: postCount,
      communities: communityCount
    })
  } catch (error) {
    console.error('Stats API error:', error)
    return res.status(500).json({ error: 'Failed to fetch stats' })
  }
}
