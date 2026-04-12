import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export default async function handler(req, res) {
  const { id } = req.query;
  const sponsorId = parseInt(id, 10);
  if (Number.isNaN(sponsorId)) {
    return res.status(400).json({ error: 'Invalid sponsor id' });
  }

  try {
    if (req.method === 'GET') {
      let stats = await prisma.sponsorStats.findUnique({
        where: { sponsorId }
      });
      if (!stats) {
        stats = await prisma.sponsorStats.create({
          data: { sponsorId }
        });
      }
      const ctrPercent = stats.impressions > 0 
        ? ((stats.clicks / stats.impressions) * 100).toFixed(2)
        : 0;
      const conversionRate = stats.clicks > 0
        ? ((stats.conversions / stats.clicks) * 100).toFixed(2)
        : 0;
      return res.status(200).json({
        ...stats,
        ctr: ctrPercent,
        conversionRate
      });
    }

    if (req.method === 'POST') {
      const { action } = req.body; // 'impression', 'click', 'conversion'
      let stats = await prisma.sponsorStats.findUnique({
        where: { sponsorId }
      });
      if (!stats) {
        stats = await prisma.sponsorStats.create({
          data: { sponsorId }
        });
      }
      
      if (action === 'impression') {
        stats = await prisma.sponsorStats.update({
          where: { sponsorId },
          data: { impressions: { increment: 1 } }
        });
      } else if (action === 'click') {
        stats = await prisma.sponsorStats.update({
          where: { sponsorId },
          data: { clicks: { increment: 1 } }
        });
      } else if (action === 'conversion') {
        stats = await prisma.sponsorStats.update({
          where: { sponsorId },
          data: { conversions: { increment: 1 } }
        });
      }
      return res.status(200).json(stats);
    }
  } catch (e) {
    console.error('sponsor stats error', e);
    return res.status(500).json({ error: 'Internal server error' });
  }

  res.setHeader('Allow', ['GET', 'POST']);
  res.status(405).end(`Method ${req.method} Not Allowed`);
}
