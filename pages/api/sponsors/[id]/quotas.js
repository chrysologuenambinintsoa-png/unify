import prisma from '../../../../lib/prisma';

export default async function handler(req, res) {
  const { id } = req.query;
  const sponsorId = parseInt(id, 10);
  if (Number.isNaN(sponsorId)) {
    return res.status(400).json({ error: 'Invalid sponsor id' });
  }

  try {
    if (req.method === 'GET') {
      let quota = await prisma.sponsorQuota.findUnique({
        where: { sponsorId }
      });
      if (!quota) {
        quota = await prisma.sponsorQuota.create({
          data: { sponsorId }
        });
      }
      return res.status(200).json(quota);
    }

    if (req.method === 'PUT') {
      const {
        dailyBudgetLimit,
        monthlyBudgetLimit,
        totalBudgetLimit,
        dailyImpressionLimit,
        monthlyImpressionLimit,
        active
      } = req.body;

      const quota = await prisma.sponsorQuota.upsert({
        where: { sponsorId },
        update: {
          dailyBudgetLimit,
          monthlyBudgetLimit,
          totalBudgetLimit,
          dailyImpressionLimit,
          monthlyImpressionLimit,
          active
        },
        create: {
          sponsorId,
          dailyBudgetLimit,
          monthlyBudgetLimit,
          totalBudgetLimit,
          dailyImpressionLimit,
          monthlyImpressionLimit,
          active
        }
      });
      return res.status(200).json(quota);
    }

    if (req.method === 'POST') {
      const { action, amount } = req.body; // action: 'addBudgetToday', 'addImpressions', etc
      let quota = await prisma.sponsorQuota.findUnique({
        where: { sponsorId }
      });
      if (!quota) {
        quota = await prisma.sponsorQuota.create({
          data: { sponsorId }
        });
      }

      if (action === 'addBudgetToday') {
        quota = await prisma.sponsorQuota.update({
          where: { sponsorId },
          data: {
            budgetSpentToday: { increment: amount },
            budgetSpentMonth: { increment: amount }
          }
        });
      } else if (action === 'addImpressionToday') {
        quota = await prisma.sponsorQuota.update({
          where: { sponsorId },
          data: {
            impressionsToday: { increment: 1 },
            impressionsMonth: { increment: 1 }
          }
        });
      }
      return res.status(200).json(quota);
    }
  } catch (e) {
    console.error('sponsor quota error', e);
    return res.status(500).json({ error: 'Internal server error' });
  }

  res.setHeader('Allow', ['GET', 'PUT', 'POST']);
  res.status(405).end(`Method ${req.method} Not Allowed`);
}
