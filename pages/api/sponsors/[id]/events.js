import prisma from '../../../../lib/prisma';

export default async function handler(req, res) {
  const { id } = req.query;
  const sponsorId = parseInt(id, 10);
  if (Number.isNaN(sponsorId)) {
    return res.status(400).json({ error: 'Invalid sponsor id' });
  }

  try {
    if (req.method === 'POST') {
      const { event, amount } = req.body;
      
      if (!event) {
        return res.status(400).json({ error: 'Event type is required' });
      }

      // Verify sponsor exists
      const sponsor = await prisma.sponsor.findUnique({ where: { id: sponsorId } });
      if (!sponsor) {
        return res.status(404).json({ error: 'Sponsor not found' });
      }

      let stats = await prisma.sponsorStats.findUnique({ where: { sponsorId } });
      if (!stats) {
        stats = await prisma.sponsorStats.create({ data: { sponsorId } });
      }

      let quota = await prisma.sponsorQuota.findUnique({ where: { sponsorId } });
      if (!quota) {
        quota = await prisma.sponsorQuota.create({ data: { sponsorId } });
      }

      let updateData = {};

      if (event === 'impression') {
        updateData = {
          impressions: { increment: 1 }
        };
        // Update quota
        await prisma.sponsorQuota.update({
          where: { sponsorId },
          data: {
            impressionsToday: { increment: 1 },
            impressionsMonth: { increment: 1 }
          }
        });
      } else if (event === 'click') {
        updateData = {
          clicks: { increment: 1 }
        };
      } else if (event === 'conversion') {
        updateData = {
          conversions: { increment: 1 }
        };
      } else if (event === 'spend' && amount) {
        // Track budget spending
        updateData = {
          totalBudgetSpent: { increment: parseFloat(amount) }
        };
        // Update quota
        await prisma.sponsorQuota.update({
          where: { sponsorId },
          data: {
            budgetSpentToday: { increment: parseFloat(amount) },
            budgetSpentMonth: { increment: parseFloat(amount) }
          }
        });
      } else {
        return res.status(400).json({ error: 'Invalid event type' });
      }

      const updatedStats = await prisma.sponsorStats.update({
        where: { sponsorId },
        data: updateData
      });

      // Calculate metrics
      const ctrPercent = updatedStats.impressions > 0 
        ? ((updatedStats.clicks / updatedStats.impressions) * 100).toFixed(2)
        : 0;
      const conversionRate = updatedStats.clicks > 0
        ? ((updatedStats.conversions / updatedStats.clicks) * 100).toFixed(2)
        : 0;

      return res.status(200).json({
        stats: {
          ...updatedStats,
          ctr: ctrPercent,
          conversionRate
        }
      });
    }
  } catch (e) {
    console.error('sponsor events error', e);
    return res.status(500).json({ error: 'Internal server error' });
  }

  res.setHeader('Allow', ['POST']);
  res.status(405).end(`Method ${req.method} Not Allowed`);
}
