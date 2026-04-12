import prisma from '../../../../../../lib/prisma'

export default async function handler(req, res) {
  const { id, commentId } = req.query;
  const parsedId = parseInt(id, 10);
  const parsedCommentId = parseInt(commentId, 10);
  if (Number.isNaN(parsedId) || Number.isNaN(parsedCommentId)) return res.status(400).json({ error: 'Invalid id' });

  if (req.method === 'POST') {
    try {
      const { action } = req.body;
      if (!action) return res.status(400).json({ error: 'action is required' });
      if (action === 'like') {
        const updated = await prisma.comment.update({ where: { id: parsedCommentId }, data: { likes: { increment: 1 } } });
        return res.json({ likes: updated.likes });
      }
      if (action === 'unlike') {
        // decrement but not below zero
        const current = await prisma.comment.findUnique({ where: { id: parsedCommentId } });
        const newLikes = Math.max(0, (current.likes || 0) - 1);
        const updated = await prisma.comment.update({ where: { id: parsedCommentId }, data: { likes: newLikes } });
        return res.json({ likes: updated.likes });
      }
      return res.status(400).json({ error: 'unknown action' });
    } catch (e) {
      console.error('comment reaction error', e);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  res.setHeader('Allow', ['POST']);
  res.status(405).end(`Method ${req.method} Not Allowed`);
}
