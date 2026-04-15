import prisma from '../../../lib/prisma';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { userEmail, period = 'hour', range = 24 } = req.query;
  
  if (!userEmail) {
    return res.status(400).json({ error: 'userEmail required' });
  }

  try {
    const user = await prisma.user.findUnique({ 
      where: { email: userEmail }
    });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userId = user.id;

    const followersCount = await prisma.friendship.count({
      where: { friendId: userId, status: 'accepted' }
    });

    const followingCount = await prisma.friendship.count({
      where: { userId: userId, status: 'accepted' }
    });

    const posts = await prisma.post.findMany({
      where: { authorId: userId },
      select: { id: true }
    });
    const postIds = posts.map(p => p.id);

    let totalLikes = 0;
    let totalComments = 0;
    let totalShares = 0;
    let profileViews = 0;

    if (postIds.length > 0) {
      const likesCount = await prisma.like.count({
        where: { postId: { in: postIds } }
      });
      totalLikes = likesCount;

      const commentsCount = await prisma.comment.count({
        where: { postId: { in: postIds } }
      });
      totalComments = commentsCount;
    }

    const recentPosts = await prisma.post.findMany({
      where: { authorId: userId },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        id: true,
        content: true,
        createdAt: true
      }
    });

    const recentActivity = await Promise.all(recentPosts.map(async post => {
      const [likesCount, commentsCount] = await Promise.all([
        prisma.like.count({ where: { postId: post.id } }),
        prisma.comment.count({ where: { postId: post.id } })
      ]);
      return {
        id: post.id,
        type: 'post',
        content: post.content?.substring(0, 50) + (post.content?.length > 50 ? '...' : ''),
        likes: likesCount,
        comments: commentsCount,
        date: new Date(post.createdAt).toLocaleDateString('fr-FR')
      };
    }));

    const now = new Date();
    const startDate = new Date(now.getTime() - (range * 60 * 60 * 1000));
    
    const viewsByPeriod = postIds.length > 0 ? await prisma.post.groupBy({
      by: ['createdAt'],
      where: {
        id: { in: postIds },
        createdAt: { gte: startDate }
      },
      _count: true
    }) : [];

    const likesByPeriod = await prisma.like.groupBy({
      by: ['createdAt'],
      where: {
        postId: { in: postIds.length > 0 ? postIds : [0] },
        createdAt: { gte: startDate }
      },
      _count: true
    });

    const hoursMap = {};
    for (let i = 0; i < range; i++) {
      const hourDate = new Date(now.getTime() - (i * 60 * 60 * 1000));
      const hourKey = hourDate.toISOString().slice(0, 13) + ':00';
      hoursMap[hourKey] = { period: hourKey, vues: 0, likes: 0 };
    }

    viewsByPeriod.forEach(v => {
      const hourKey = v.createdAt.toISOString().slice(0, 13) + ':00';
      if (hoursMap[hourKey]) {
        hoursMap[hourKey].vues += v._count;
      }
    });

    likesByPeriod.forEach(l => {
      const hourKey = l.createdAt.toISOString().slice(0, 13) + ':00';
      if (hoursMap[hourKey]) {
        hoursMap[hourKey].likes += l._count;
      }
    });

    const activityData = Object.values(hoursMap).sort((a, b) => 
      a.period.localeCompare(b.period)
    );

    const activityDataFormatted = activityData.map(item => ({
      heure: item.period.slice(11, 16),
      vues: item.vues,
      likes: item.likes
    }));

    res.status(200).json({
      stats: {
        followers: followersCount,
        following: followingCount,
        views: profileViews,
        likes: totalLikes,
        comments: totalComments,
        shares: totalShares
      },
      recentActivity,
      activity: activityDataFormatted
    });

  } catch (error) {
    console.error('Dashboard API error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}