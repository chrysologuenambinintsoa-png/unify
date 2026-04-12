import prisma from '../../../../lib/prisma';

/**
 * Track sponsor events: impressions, clicks, conversions, spending
 * POST /api/sponsors/[id]/track-event
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const { id } = req.query;
  const sponsorId = parseInt(id, 10);
  
  if (Number.isNaN(sponsorId)) {
    return res.status(400).json({ error: 'Invalid sponsor id' });
  }

  try {
    const { event, userId, userEmail, metadata = {} } = req.body;

    if (!event) {
      return res.status(400).json({ error: 'Event type is required' });
    }

    // Verify sponsor exists
    const sponsor = await prisma.sponsor.findUnique({ 
      where: { id: sponsorId },
      include: { stats: true, quotas: true }
    });
    
    if (!sponsor) {
      return res.status(404).json({ error: 'Sponsor not found' });
    }

    let stats = sponsor.stats;
    if (!stats) {
      stats = await prisma.sponsorStats.create({ 
        data: { sponsorId } 
      });
    }

    let quotas = sponsor.quotas;
    if (!quotas) {
      quotas = await prisma.sponsorQuota.create({ 
        data: { sponsorId } 
      });
    }

    let statsUpdate = {};
    let quotasUpdate = {};
    let response = { success: true };

    // Handle different event types
    switch (event.toLowerCase()) {
      case 'impression':
        statsUpdate = { impressions: { increment: 1 } };
        quotasUpdate = {
          impressionsToday: { increment: 1 },
          impressionsMonth: { increment: 1 }
        };
        break;

      case 'click':
        statsUpdate = { clicks: { increment: 1 } };
        break;

      case 'conversion':
        statsUpdate = { conversions: { increment: 1 } };
        break;

      case 'spend':
        const amount = parseFloat(metadata.amount || 0);
        if (amount <= 0) {
          return res.status(400).json({ error: 'Spend amount must be positive' });
        }
        statsUpdate = { totalBudgetSpent: { increment: amount } };
        quotasUpdate = {
          budgetSpentToday: { increment: amount },
          budgetSpentMonth: { increment: amount }
        };
        response.spent = amount;
        break;

      default:
        return res.status(400).json({ error: `Unknown event type: ${event}` });
    }

    // Check quotas before updating
    if (quotasUpdate.budgetSpentToday) {
      const newDaily = quotas.budgetSpentToday + (metadata.amount || 0);
      const newMonthly = quotas.budgetSpentMonth + (metadata.amount || 0);
      
      if (quotas.dailyBudgetLimit && newDaily > quotas.dailyBudgetLimit) {
        return res.status(429).json({ 
          error: 'Daily budget limit exceeded',
          current: quotas.budgetSpentToday,
          limit: quotas.dailyBudgetLimit
        });
      }
      if (quotas.monthlyBudgetLimit && newMonthly > quotas.monthlyBudgetLimit) {
        return res.status(429).json({ 
          error: 'Monthly budget limit exceeded',
          current: quotas.budgetSpentMonth,
          limit: quotas.monthlyBudgetLimit
        });
      }
    }

    if (quotasUpdate.impressionsToday) {
      const newDaily = quotas.impressionsToday + 1;
      const newMonthly = quotas.impressionsMonth + 1;
      
      if (quotas.dailyImpressionLimit && newDaily > quotas.dailyImpressionLimit) {
        return res.status(429).json({ 
          error: 'Daily impression limit exceeded',
          current: quotas.impressionsToday,
          limit: quotas.dailyImpressionLimit
        });
      }
      if (quotas.monthlyImpressionLimit && newMonthly > quotas.monthlyImpressionLimit) {
        return res.status(429).json({ 
          error: 'Monthly impression limit exceeded',
          current: quotas.impressionsMonth,
          limit: quotas.monthlyImpressionLimit
        });
      }
    }

    // Update stats
    const updatedStats = await prisma.sponsorStats.update({
      where: { sponsorId },
      data: statsUpdate
    });

    // Update quotas if needed
    if (Object.keys(quotasUpdate).length > 0) {
      await prisma.sponsorQuota.update({
        where: { sponsorId },
        data: quotasUpdate
      });
    }

    // Calculate metrics
    const ctrPercent = updatedStats.impressions > 0 
      ? ((updatedStats.clicks / updatedStats.impressions) * 100).toFixed(2)
      : 0;
    const conversionRate = updatedStats.clicks > 0
      ? ((updatedStats.conversions / updatedStats.clicks) * 100).toFixed(2)
      : 0;

    response.stats = {
      impressions: updatedStats.impressions,
      clicks: updatedStats.clicks,
      conversions: updatedStats.conversions,
      totalBudgetSpent: updatedStats.totalBudgetSpent,
      ctr: ctrPercent,
      conversionRate,
      costPerClick: updatedStats.clicks > 0 
        ? (updatedStats.totalBudgetSpent / updatedStats.clicks).toFixed(2)
        : 0,
      costPerConversion: updatedStats.conversions > 0
        ? (updatedStats.totalBudgetSpent / updatedStats.conversions).toFixed(2)
        : 0
    };

    return res.status(200).json(response);
  } catch (e) {
    console.error('sponsor track event error', e);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
