import prisma from '../../../lib/prisma';

export default async function handler(req, res) {
  const { method } = req;

  try {
    if (method === 'GET') {
      // List marketplace products with pagination
      const { category, skip = 0, take = 20, search } = req.query;
      const where = { status: 'active' };
      
      if (category) where.category = category;
      if (search) {
        where.OR = [
          { title: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } }
        ];
      }

      const products = await prisma.marketplaceProduct.findMany({
        where,
        skip: parseInt(skip),
        take: parseInt(take),
        orderBy: { createdAt: 'desc' },
        include: { reviews: { select: { rating: true } } }
      });

      const total = await prisma.marketplaceProduct.count({ where });

      // Calculate average rating for each product
      const productsWithRating = products.map(p => ({
        ...p,
        averageRating: p.reviews.length > 0 
          ? (p.reviews.reduce((sum, r) => sum + r.rating, 0) / p.reviews.length).toFixed(1)
          : null,
        reviewCount: p.reviews.length
      }));

      return res.status(200).json({ products: productsWithRating, total });
    }

    if (method === 'POST') {
      const { title, description, category, price, images, sellerEmail, condition, location } = req.body;

      if (!title || !category || !price || !sellerEmail) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      // Verify seller exists and is authorized to sell (agreement/payment)
      const seller = await prisma.user.findUnique({ where: { email: sellerEmail } });
      if (!seller || !seller.isApprovedSeller) {
        return res.status(403).json({ error: 'Vous devez être un vendeur autorisé pour publier des articles. Contactez le support pour activer votre compte vendeur.' });
      }

      const product = await prisma.marketplaceProduct.create({
        data: {
          title,
          description: description || null,
          category,
          price: parseFloat(price),
          images: images ? JSON.stringify(images) : null,
          sellerEmail,
          condition: condition || null,
          location: location || null
        },
        include: { reviews: { select: { rating: true } } }
      });

      return res.status(201).json(product);
    }
  } catch (e) {
    console.error('Marketplace API error', e);
    return res.status(500).json({ error: 'Internal server error' });
  }

  res.setHeader('Allow', ['GET', 'POST']);
  res.status(405).end(`Method ${method} Not Allowed`);
}
