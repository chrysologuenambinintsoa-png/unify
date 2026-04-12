import prisma from '../../../../lib/prisma';

export default async function handler(req, res) {
  const { id } = req.query;
  const { method } = req;
  const { userEmail } = req.body;

  if (!id || !userEmail) {
    return res.status(400).json({ error: 'Product ID and user email required' });
  }

  try {
    if (method === 'POST') {
      const product = await prisma.marketplaceProduct.findUnique({
        where: { id: parseInt(id) }
      });

      if (!product) {
        return res.status(404).json({ error: 'Product not found' });
      }

      const favoredBy = product.favoredBy ? JSON.parse(product.favoredBy) : [];
      const isFavored = favoredBy.includes(userEmail);

      if (isFavored) {
        // Remove from favorites
        const updated = favoredBy.filter(e => e !== userEmail);
        await prisma.marketplaceProduct.update({
          where: { id: parseInt(id) },
          data: {
            favoredBy: JSON.stringify(updated),
            favorites: { decrement: 1 }
          }
        });
        return res.status(200).json({ message: 'Removed from favorites' });
      } else {
        // Add to favorites
        favoredBy.push(userEmail);
        await prisma.marketplaceProduct.update({
          where: { id: parseInt(id) },
          data: {
            favoredBy: JSON.stringify(favoredBy),
            favorites: { increment: 1 }
          }
        });
        return res.status(200).json({ message: 'Added to favorites' });
      }
    }
  } catch (e) {
    console.error('Marketplace favorites API error', e);
    return res.status(500).json({ error: 'Internal server error' });
  }

  res.setHeader('Allow', ['POST']);
  res.status(405).end(`Method ${method} Not Allowed`);
}
