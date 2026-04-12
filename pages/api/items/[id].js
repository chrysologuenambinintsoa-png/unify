import prisma from '../../../lib/prisma'

export default async function handler(req, res) {
  const { id } = req.query;
  const parsedId = parseInt(id, 10);
  if (Number.isNaN(parsedId)) return res.status(400).json({ error: 'Invalid id' });

  if (req.method === 'GET') {
    const item = await prisma.item.findUnique({ where: { id: parsedId }, include: { comments: true } });
    if (!item) return res.status(404).json({ error: 'Not found' });
    return res.json(item);
  }

  if (req.method === 'PUT') {
    const { title, content } = req.body;
    const item = await prisma.item.update({ where: { id: parsedId }, data: { title, content } });
    return res.json(item);
  }

  if (req.method === 'DELETE') {
    await prisma.item.delete({ where: { id: parsedId } });
    return res.status(204).end();
  }

  res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
  res.status(405).end(`Method ${req.method} Not Allowed`);
}
