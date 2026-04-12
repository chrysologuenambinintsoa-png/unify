import { PrismaClient } from '@prisma/client';
import { getUserFromToken } from '../../../lib/auth'
const prisma = new PrismaClient();

export default async function handler(req, res) {
  const { method } = req;

  try {
    if (method === 'GET') {
      // list active sponsors, optionally filtered by owner
      const { ownerEmail } = req.query;
      const whereClause = { active: true };
      if (ownerEmail) {
        whereClause.ownerEmail = ownerEmail;
      }
      const sponsors = await prisma.sponsor.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' },
      });
      return res.status(200).json({ sponsors });
    }

    if (method === 'POST') {
      // Require authentication and verify the user paid the platform fee
      const auth = req.headers.authorization || ''
      const token = auth.startsWith('Bearer ') ? auth.split(' ')[1] : null
      const user = token ? await getUserFromToken(token) : null
      if (!user) return res.status(401).json({ error: 'Authentication required' })

      const { title, content, link, image, avatarUrl, ownerEmail, active } = req.body;
      if (!title) {
        return res.status(400).json({ error: 'title is required' });
      }

      // Ensure the creating user has completed at least one sponsor purchase (platform fee)
      const completedPurchase = await prisma.sponsorPurchase.findFirst({
        where: { userEmail: user.email, status: 'completed', sponsorId: null },
        orderBy: { createdAt: 'desc' }
      })
      if (!completedPurchase) {
        return res.status(403).json({ error: "Paiement requis : vous devez d'abord payer les frais de plateforme pour créer une publicité." })
      }

      // Check if user already has an active sponsor page
      const existingSponsor = await prisma.sponsor.findFirst({
        where: { ownerEmail: user.email, active: true }
      })
      if (existingSponsor) {
        return res.status(409).json({ error: "Vous avez déjà une page sponsorisée active. Vous ne pouvez pas en créer une nouvelle." })
      }

      const sponsor = await prisma.sponsor.create({
        data: {
          title,
          content: content || null,
          link: link || null,
          image: image || null,
          avatarUrl: avatarUrl || null,
          ownerEmail: ownerEmail || user.email,
          active: active !== undefined ? active : true,
        },
      });

      await prisma.sponsorPurchase.update({
        where: { id: completedPurchase.id },
        data: { sponsorId: sponsor.id }
      })

      return res.status(201).json(sponsor);
    }
  } catch (e) {
    console.error('sponsors api error', e);
    return res.status(500).json({ error: 'Internal server error' });
  }

  res.setHeader('Allow', ['GET', 'POST']);
  res.status(405).end(`Method ${method} Not Allowed`);
}
