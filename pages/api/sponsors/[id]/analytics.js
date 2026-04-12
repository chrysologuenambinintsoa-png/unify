import prisma from '../../../../lib/prisma';

export default async function handler(req, res) {
  const { id } = req.query;
  const sponsorId = parseInt(id, 10);
  if (Number.isNaN(sponsorId)) {
    return res.status(400).json({ error: 'Invalid sponsor id' });
  }

  try {
    if (req.method === 'GET') {
      // Fetch complete analytics data for a sponsor
      const sponsor = await prisma.sponsor.findUnique({
        where: { id: sponsorId },
        include: {
          stats: true,
          targeting: true,
          quotas: true,
          purchases: {
            orderBy: { createdAt: 'desc' },
            take: 50 // Last 50 purchases
          }
        }
      });

      if (!sponsor) {
        return res.status(404).json({ error: 'Sponsor not found' });
      }

      // Parse JSON fields in targeting
      const targetingData = sponsor.targeting ? {
        ...sponsor.targeting,
        countries: sponsor.targeting.countries ? JSON.parse(sponsor.targeting.countries) : [],
        cities: sponsor.targeting.cities ? JSON.parse(sponsor.targeting.cities) : [],
        interests: sponsor.targeting.interests ? JSON.parse(sponsor.targeting.interests) : [],
        devices: sponsor.targeting.devices ? JSON.parse(sponsor.targeting.devices) : []
      } : null;

      // Calculate additional metrics
      const stats = sponsor.stats || {};
      const ctrPercent = stats.impressions > 0 
        ? ((stats.clicks / stats.impressions) * 100).toFixed(2)
        : 0;
      const conversionRate = stats.clicks > 0
        ? ((stats.conversions / stats.clicks) * 100).toFixed(2)
        : 0;

      // Calculate total revenue from purchases
      const totalRevenue = sponsor.purchases.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);

      return res.status(200).json({
        sponsor: {
          ...sponsor,
          stats: {
            ...stats,
            ctr: ctrPercent,
            conversionRate,
            costPerClick: stats.clicks > 0 ? (stats.totalBudgetSpent / stats.clicks).toFixed(2) : 0,
            costPerConversion: stats.conversions > 0 ? (stats.totalBudgetSpent / stats.conversions).toFixed(2) : 0
          },
          targeting: targetingData,
          purchases: sponsor.purchases,
          totalRevenue
        }
      });
    }
  } catch (e) {
    console.error('sponsor analytics error', e);
    return res.status(500).json({ error: 'Internal server error' });
  }

  res.setHeader('Allow', ['GET']);
  res.status(405).end(`Method ${req.method} Not Allowed`);
}
