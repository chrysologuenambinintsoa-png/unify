import prisma from '../../../lib/prisma';

export default async function handler(req, res) {
  const { method } = req;

  try {
    if (method === 'GET') {
      // optionally filter by userEmail or sponsorId
      const { userEmail, sponsorId } = req.query;
      const where = {};
      if (userEmail) where.userEmail = userEmail;
      if (sponsorId) where.sponsorId = parseInt(sponsorId, 10);
      const purchases = await prisma.sponsorPurchase.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        include: { sponsor: true }
      });
      return res.status(200).json({ purchases });
    }

    if (method === 'POST') {
      const { sponsorId, amount, currency, userEmail } = req.body;
      if (!sponsorId || !amount) {
        return res.status(400).json({ error: 'sponsorId and amount are required' });
      }
      const purchase = await prisma.sponsorPurchase.create({
        data: {
          sponsorId: parseInt(sponsorId, 10),
          amount: parseFloat(amount),
          currency: currency || 'EUR',
          userEmail: userEmail || null,
          status: 'completed'
        }
      });
      return res.status(201).json(purchase);
    }
  } catch (e) {
    console.error('sponsor purchases api error', e);
    return res.status(500).json({ error: 'Internal server error' });
  }

  res.setHeader('Allow', ['GET', 'POST']);
  res.status(405).end(`Method ${method} Not Allowed`);
}
