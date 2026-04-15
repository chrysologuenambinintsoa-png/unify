import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export default async function handler(req, res) {
  const { id, reviewId } = req.query;
  const { method } = req;

  if (!id || !reviewId) {
    return res.status(400).json({ error: 'Page ID and Review ID are required' });
  }

  const pageIdNum = parseInt(id, 10);
  const reviewIdNum = parseInt(reviewId, 10);

  if (isNaN(pageIdNum) || isNaN(reviewIdNum)) {
    return res.status(400).json({ error: 'Invalid ID' });
  }

  try {
    if (method === 'POST') {
      const { action, userEmail } = req.body;

      if (action === 'helpful') {
        if (!userEmail) {
          return res.status(400).json({ error: 'User email is required' });
        }

        const existing = await prisma.$queryRaw`
          SELECT id FROM PageReviewHelpful WHERE reviewId = ${reviewIdNum} AND userEmail = ${userEmail}
        `;

        if (existing.length > 0) {
          await prisma.$executeRaw`DELETE FROM PageReviewHelpful WHERE reviewId = ${reviewIdNum} AND userEmail = ${userEmail}`;
        } else {
          await prisma.$executeRaw`INSERT INTO PageReviewHelpful (reviewId, userEmail, createdAt) VALUES (${reviewIdNum}, ${userEmail}, datetime('now'))`;
        }

        const countResult = await prisma.$queryRaw`SELECT COUNT(*) as count FROM PageReviewHelpful WHERE reviewId = ${reviewIdNum}`;
        const helpfulCount = parseInt(countResult[0].count, 10);

        return res.status(200).json({ helpfulCount });
      }

      if (action === 'reply') {
        const { text } = req.body;

        if (!text || !userEmail) {
          return res.status(400).json({ error: 'Text and user email are required' });
        }

        await prisma.$executeRaw`
          INSERT INTO PageReviewReply (reviewId, authorEmail, text, createdAt)
          VALUES (${reviewIdNum}, ${userEmail}, ${text}, datetime('now'))
        `;

        const replyResult = await prisma.$queryRaw`
          SELECT pr.id, pr.createdAt, u.id as authorId, u.nomUtilisateur, u.avatar
          FROM PageReviewReply pr
          LEFT JOIN User u ON pr.authorEmail = u.email
          WHERE pr.reviewId = ${reviewIdNum} AND pr.authorEmail = ${userEmail}
          ORDER BY pr.id DESC LIMIT 1
        `;

        if (replyResult.length === 0) {
          return res.status(500).json({ error: 'Failed to create reply' });
        }

        const r = replyResult[0];
        const formattedReply = {
          id: r.id,
          author: {
            id: r.authorId,
            name: r.nomUtilisateur || userEmail?.split('@')[0] || 'Utilisateur',
            avatar: r.avatar || '/images/default-page.png'
          },
          text,
          createdAt: r.createdAt
        };

        return res.status(201).json(formattedReply);
      }

      return res.status(400).json({ error: 'Unknown action' });
    }

    if (method === 'GET') {
      const { userEmail } = req.query;
      
      const countResult = await prisma.$queryRaw`SELECT COUNT(*) as count FROM PageReviewHelpful WHERE reviewId = ${reviewIdNum}`;
      const helpfulCount = parseInt(countResult[0].count, 10);
      
      let userVoted = false;
      if (userEmail) {
        const votedResult = await prisma.$queryRaw`SELECT id FROM PageReviewHelpful WHERE reviewId = ${reviewIdNum} AND userEmail = ${userEmail}`;
        userVoted = votedResult.length > 0;
      }

      const replies = await prisma.$queryRaw`
        SELECT pr.id, pr.authorEmail, pr.text, pr.createdAt, u.id as authorId, u.nomUtilisateur, u.avatar
        FROM PageReviewReply pr
        LEFT JOIN User u ON pr.authorEmail = u.email
        WHERE pr.reviewId = ${reviewIdNum}
        ORDER BY pr.createdAt ASC
      `;

      const formattedReplies = (replies || []).map(r => ({
        id: r.id,
        author: {
          id: r.authorId,
          name: r.nomUtilisateur || r.authorEmail?.split('@')[0] || 'Utilisateur',
          avatar: r.avatar || '/images/default-page.png'
        },
        text: r.text,
        createdAt: r.createdAt
      }));

      return res.status(200).json({ helpfulCount, userVoted, replies: formattedReplies });
    }
  } catch (e) {
    console.error('Page review interaction API error', e);
    return res.status(500).json({ error: 'Internal server error', message: e.message });
  }

  res.setHeader('Allow', ['GET', 'POST']);
  res.status(405).end(`Method ${method} Not Allowed`);
}