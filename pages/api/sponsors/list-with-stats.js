import prisma from '../../../lib/prisma';

export default async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      // Get all active sponsors with their complete stats
      const sponsors = await prisma.sponsor.findMany({
        where: { active: true },
        include: {
          stats: true,
          targeting: true,
          quotas: true,
          purchases: {
            orderBy: { createdAt: 'desc' },
            take: 10
          }
        },
        orderBy: { createdAt: 'desc' }
      });

      // Format response with calculated metrics
      const formattedSponsors = sponsors.map(sponsor => {
        const stats = sponsor.stats || {};
        const ctrPercent = stats.impressions > 0 
          ? ((stats.clicks / stats.impressions) * 100).toFixed(2)
          : 0;
        const conversionRate = stats.clicks > 0
          ? ((stats.conversions / stats.clicks) * 100).toFixed(2)
          : 0;

        // Parse targeting JSON
        const targetingData = sponsor.targeting ? {
          ...sponsor.targeting,
          countries: sponsor.targeting.countries ? JSON.parse(sponsor.targeting.countries) : [],
          cities: sponsor.targeting.cities ? JSON.parse(sponsor.targeting.cities) : [],
          interests: sponsor.targeting.interests ? JSON.parse(sponsor.targeting.interests) : [],
          devices: sponsor.targeting.devices ? JSON.parse(sponsor.targeting.devices) : []
        } : null;

        const totalRevenue = sponsor.purchases.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);

        return {
          ...sponsor,
          stats: {
            ...stats,
            ctr: ctrPercent,
            conversionRate,
            costPerClick: stats.clicks > 0 ? (stats.totalBudgetSpent / stats.clicks).toFixed(2) : 0,
            costPerConversion: stats.conversions > 0 ? (stats.totalBudgetSpent / stats.conversions).toFixed(2) : 0
          },
          targeting: targetingData,
          totalRevenue
        };
      });

      return res.status(200).json({ 
        sponsors: formattedSponsors,
        count: formattedSponsors.length
      });
    }
  } catch (e) {
    console.error('sponsors list api error', e);
    return res.status(500).json({ error: 'Internal server error' });
  }

  res.setHeader('Allow', ['GET']);
  res.status(405).end(`Method ${req.method} Not Allowed`);
}
