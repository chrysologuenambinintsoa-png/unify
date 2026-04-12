import prisma from '../../../lib/prisma';

export default async function handler(req, res) {
  const { id } = req.query;
  const parsedId = parseInt(id, 10);
  if (Number.isNaN(parsedId)) {
    return res.status(400).json({ error: 'Invalid id' });
  }

  try {
    if (req.method === 'GET') {
      const sponsor = await prisma.sponsor.findUnique({ where: { id: parsedId } });
      if (!sponsor) return res.status(404).json({ error: 'Sponsor not found' });
      return res.status(200).json(sponsor);
    }

    if (req.method === 'PUT') {
      const { title, content, link, image, active } = req.body;
      const updated = await prisma.sponsor.update({
        where: { id: parsedId },
        data: {
          title,
          content,
          link,
          image,
          active,
        },
      });
      return res.status(200).json(updated);
    }

    if (req.method === 'DELETE') {
      await prisma.sponsor.delete({ where: { id: parsedId } });
      return res.status(204).end();
    }
  } catch (e) {
    console.error('sponsor/[id] api error', e);
    return res.status(500).json({ error: 'Internal server error' });
  }

  res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
  res.status(405).end(`Method ${req.method} Not Allowed`);
}
