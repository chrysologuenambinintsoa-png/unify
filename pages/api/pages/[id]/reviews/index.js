import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export default async function handler(req, res) {
  const { id } = req.query;
  const { method } = req;

  if (!id) {
    return res.status(400).json({ error: 'Page ID is required' });
  }

  try {
    if (method === 'GET') {
      const pageIdNum = parseInt(id, 10);
      if (isNaN(pageIdNum)) {
        return res.status(400).json({ error: 'Invalid page ID' });
      }

      const reviews = await prisma.pageReview.findMany({
        where: { pageId: pageIdNum },
        orderBy: { createdAt: 'desc' }
      });

      // Fetch authors separately
      const authorEmails = reviews.map(r => r.authorEmail).filter(Boolean);
      const authors = await prisma.user.findMany({
        where: { email: { in: authorEmails } },
        select: { email: true, id: true, nomUtilisateur: true, avatar: true }
      });
      const authorMap = {};
      authors.forEach(a => { authorMap[a.email] = a; });

      const formattedReviews = reviews.map(r => {
        const author = authorMap[r.authorEmail];
        return {
          id: r.id,
          pageId: r.pageId,
          authorEmail: r.authorEmail,
          rating: r.rating,
          text: r.text,
          recommends: r.recommends,
          createdAt: r.createdAt,
          updatedAt: r.updatedAt,
          author: {
            id: author?.id || null,
            name: author?.nomUtilisateur || r.authorEmail?.split('@')[0] || 'Utilisateur',
            avatar: author?.avatar || '/images/default-page.png',
            email: r.authorEmail
          }
        };
      });

      return res.status(200).json(formattedReviews);
    }

    if (method === 'POST') {
      const { rating, text, recommends, userEmail } = req.body;

      if (!rating || rating < 1 || rating > 5) {
        return res.status(400).json({ error: 'Rating must be between 1 and 5' });
      }

      if (!userEmail) {
        return res.status(400).json({ error: 'User email is required' });
      }

      const pageIdNum = parseInt(id, 10);
      if (isNaN(pageIdNum)) {
        return res.status(400).json({ error: 'Invalid page ID' });
      }

      const review = await prisma.pageReview.create({
        data: {
          pageId: pageIdNum,
          authorEmail: userEmail,
          rating: parseInt(rating),
          text: text || null,
          recommends: recommends !== undefined ? recommends : null
        }
      });

      // Fetch author
      const author = await prisma.user.findUnique({
        where: { email: userEmail },
        select: { id: true, nomUtilisateur: true, avatar: true }
      });

      const formattedReview = {
        id: review.id,
        pageId: review.pageId,
        authorEmail: review.authorEmail,
        rating: review.rating,
        text: review.text,
        recommends: review.recommends,
        createdAt: review.createdAt,
        updatedAt: review.updatedAt,
        author: {
          id: author?.id || null,
          name: author?.nomUtilisateur || userEmail?.split('@')[0] || 'Utilisateur',
          avatar: author?.avatar || '/images/default-page.png',
          email: userEmail
        }
      };

      return res.status(201).json(formattedReview);
    }
  } catch (e) {
    console.error('Page reviews API error', e);
    return res.status(500).json({ error: 'Internal server error' });
  }

  res.setHeader('Allow', ['GET', 'POST']);
  res.status(405).end(`Method ${method} Not Allowed`);
}