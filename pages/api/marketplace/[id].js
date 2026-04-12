import prisma from '../../../lib/prisma';

export default async function handler(req, res) {
  const { id } = req.query;
  const { method } = req;

  if (!id) {
    return res.status(400).json({ error: 'Product ID is required' });
  }

  try {
    if (method === 'GET') {
      const product = await prisma.marketplaceProduct.findUnique({
        where: { id: parseInt(id) },
        include: {
          reviews: {
            select: { id: true, rating: true, comment: true, buyer: true, createdAt: true }
          },
          seller: {
            select: { email: true, prenom: true, nom: true, nomUtilisateur: true, avatar: true, avatarUrl: true }
          }
        }
      });

      if (!product) {
        return res.status(404).json({ error: 'Product not found' });
      }

      // Increment views
      await prisma.marketplaceProduct.update({
        where: { id: parseInt(id) },
        data: { views: { increment: 1 } }
      });

      return res.status(200).json(product);
    }

    if (method === 'PUT') {
      const { title, description, category, price, condition, location, status } = req.body;

      const product = await prisma.marketplaceProduct.update({
        where: { id: parseInt(id) },
        data: {
          ...(title && { title }),
          ...(description !== undefined && { description }),
          ...(category && { category }),
          ...(price && { price: parseFloat(price) }),
          ...(condition && { condition }),
          ...(location && { location }),
          ...(status && { status })
        }
      });

      return res.status(200).json(product);
    }

    if (method === 'DELETE') {
      const product = await prisma.marketplaceProduct.delete({
        where: { id: parseInt(id) }
      });

      return res.status(200).json({ message: 'Product deleted', product });
    }
  } catch (e) {
    console.error('Marketplace product API error', e);
    return res.status(500).json({ error: 'Internal server error' });
  }

  res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
  res.status(405).end(`Method ${method} Not Allowed`);
}
