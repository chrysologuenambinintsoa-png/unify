import prisma from '../../../../lib/prisma';

export default async function handler(req, res) {
  const { id } = req.query;
  const { method } = req;

  if (!id) {
    return res.status(400).json({ error: 'Product ID is required' });
  }

  try {
    if (method === 'GET') {
      const reviews = await prisma.marketplaceReview.findMany({
        where: { productId: parseInt(id) },
        orderBy: { createdAt: 'desc' }
      });

      return res.status(200).json({ reviews });
    }

    if (method === 'POST') {
      const { rating, comment, buyer } = req.body;

      if (!rating || !buyer || rating < 1 || rating > 5) {
        return res.status(400).json({ error: 'Invalid rating or missing fields' });
      }

      const review = await prisma.marketplaceReview.create({
        data: {
          productId: parseInt(id),
          rating: parseInt(rating),
          comment: comment || null,
          buyer
        }
      });

      return res.status(201).json(review);
    }
  } catch (e) {
    console.error('Marketplace reviews API error', e);
    return res.status(500).json({ error: 'Internal server error' });
  }

  res.setHeader('Allow', ['GET', 'POST']);
  res.status(405).end(`Method ${method} Not Allowed`);
}
