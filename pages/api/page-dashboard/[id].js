import prisma from '../../../lib/prisma';

export default async function handler(req, res) {
  const { id } = req.query;
  const pageId = parseInt(id, 10);

  if (isNaN(pageId)) {
    return res.status(400).json({ error: 'Invalid page ID' });
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('[page-dashboard] Starting for pageId:', pageId)
    
    const page = await prisma.page.findUnique({
      where: { id: pageId },
      include: {
        owner: {
          select: { email: true, prenom: true, nom: true, avatar: true }
        }
      }
    });
    console.log('[page-dashboard] Found page:', page?.name)

    if (!page) {
      return res.status(404).json({ error: 'Page not found' });
    }

    const followersCount = await prisma.pageFollower.count({
      where: { pageId: pageId }
    });
    console.log('[page-dashboard] Followers count:', followersCount)

    const likesCount = await prisma.pageLike.count({
      where: { pageId: pageId }
    });
    console.log('[page-dashboard] Likes count:', likesCount)

    const posts = await prisma.pagePost.findMany({
      where: { pageId: pageId },
      orderBy: { createdAt: 'desc' },
      take: 5
    });

    const postIds = posts.map(p => p.id);

    let totalLikes = 0;
    let totalComments = 0;
    let totalViews = 0;

    if (posts.length > 0) {
      totalLikes = posts.reduce((sum, post) => sum + (post.likes || 0), 0);
      totalComments = posts.reduce((sum, post) => sum + (post.comments || 0), 0);
    }

    const now = new Date();
    const startDate = new Date(now.getTime() - (24 * 60 * 60 * 1000));

    const recentPosts = await prisma.pagePost.findMany({
      where: { 
        pageId: pageId,
        createdAt: { gte: startDate }
      },
      select: {
        id: true,
        content: true,
        createdAt: true,
        likes: true,
        comments: true
      },
      orderBy: { createdAt: 'desc' },
      take: 10
    });

    const activityData = recentPosts.map(post => ({
      date: new Date(post.createdAt).toLocaleDateString('fr-FR', { 
        day: '2-digit', 
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      }),
      likes: post.likes,
      comments: post.comments
    }));

    const recentActivity = posts.map(post => ({
      id: post.id,
      content: post.content?.substring(0, 50) + (post.content?.length > 50 ? '...' : ''),
      likes: 0,
      comments: 0,
      date: new Date(post.createdAt).toLocaleDateString('fr-FR')
    }));

    res.status(200).json({
      page: {
        id: page.id,
        name: page.name,
        description: page.description,
        avatar: page.avatar,
        cover: page.cover,
        category: page.category
      },
      stats: {
        followers: followersCount,
        likes: likesCount,
        posts: posts.length,
        comments: totalComments,
        views: totalViews
      },
      recentActivity,
      activity: activityData
    });

  } catch (error) {
    console.error('Page Dashboard API error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}