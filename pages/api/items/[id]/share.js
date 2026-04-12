import prisma from '../../../../lib/prisma'

export default async function handler(req, res) {
  const { id } = req.query;
  const parsedId = parseInt(id, 10);
  if (Number.isNaN(parsedId)) return res.status(400).json({ error: 'Invalid id' });

  if (req.method === 'POST') {
    try {
      const updated = await prisma.item.update({ where: { id: parsedId }, data: { shares: { increment: 1 } } });
      return res.json({ shares: updated.shares });
    } catch (e) {
      console.error('share POST error', e);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  res.setHeader('Allow', ['POST']);
  res.status(405).end(`Method ${req.method} Not Allowed`);
}
