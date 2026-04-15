import prisma from '../../../lib/prisma';

// GET /api/user/activity?userEmail=...&period=hour|day&range=24
export default async function handler(req, res) {
  const { userEmail, period = 'hour', range = 24 } = req.query;
  if (!userEmail) return res.status(400).json({ error: 'userEmail required' });

  try {
    // Récupère l'utilisateur
    const user = await prisma.user.findUnique({ where: { email: userEmail } });
    if (!user) return res.status(404).json({ error: 'User not found' });

    // Récupère les posts de l'utilisateur
    const posts = await prisma.post.findMany({
      where: { authorId: user.id },
      select: { id: true, createdAt: true },
    });
    const postIds = posts.map(p => p.id);

    // Récupère les vues et likes groupés par heure ou jour
    let groupBy;
    let dateFormat;
    if (period === 'day') {
      groupBy = `DATE_TRUNC('day', createdAt)`;
      dateFormat = 'YYYY-MM-DD';
    } else {
      groupBy = `DATE_TRUNC('hour', createdAt)`;
      dateFormat = 'YYYY-MM-DD HH24:00';
    }

    // Vues
    const views = await prisma.$queryRawUnsafe(`
      SELECT to_char(${groupBy}, '${dateFormat}') as period, COUNT(*) as vues
      FROM "View"
      WHERE "postId" IN (${postIds.length ? postIds.join(',') : 'NULL'})
      GROUP BY period
      ORDER BY period DESC
      LIMIT $1
    `, Number(range));

    // Likes
    const likes = await prisma.$queryRawUnsafe(`
      SELECT to_char(${groupBy}, '${dateFormat}') as period, COUNT(*) as likes
      FROM "Like"
      WHERE "postId" IN (${postIds.length ? postIds.join(',') : 'NULL'})
      GROUP BY period
      ORDER BY period DESC
      LIMIT $1
    `, Number(range));

    // Fusionne les deux séries
    const data = {};
    views.forEach(v => { data[v.period] = { period: v.period, vues: Number(v.vues), likes: 0 }; });
    likes.forEach(l => {
      if (!data[l.period]) data[l.period] = { period: l.period, vues: 0, likes: 0 };
      data[l.period].likes = Number(l.likes);
    });
    // Trie par date croissante
    const result = Object.values(data).sort((a, b) => a.period.localeCompare(b.period));
    res.status(200).json({ activity: result });
  } catch (err) {
    console.error('user activity API error', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}
