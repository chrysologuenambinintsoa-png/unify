import prisma from '../../../../lib/prisma'
import { createNotification } from '../../../../lib/notifications'

export default async function handler(req, res) {
  const { id } = req.query;
  const parsedId = parseInt(id, 10);
  if (Number.isNaN(parsedId)) return res.status(400).json({ error: 'Invalid id' });

  if (req.method === 'POST') {
    try {
      const { action } = req.body;
      if (!action) return res.status(400).json({ error: 'action is required' });
      if (action === 'like') {
        const updated = await prisma.item.update({ where: { id: parsedId }, data: { likes: { increment: 1 } } });
        // create notification for post author
        try {
          const item = await prisma.item.findUnique({ where: { id: parsedId } });
          if (item && item.author) {
            // Try to find post owner by email first, then by username
            let user = await prisma.user.findUnique({ where: { email: item.author } });
            if (!user) {
              user = await prisma.user.findUnique({ where: { nomUtilisateur: item.author } });
            }
            if (user) {
              // Get the liker from header or body
              let likerId = null;
              const userStr = req.headers['x-user-id'];
              if (userStr) {
                try {
                  const liker = typeof userStr === 'string' ? JSON.parse(userStr) : userStr;
                  likerId = liker?.id;
                } catch (e) {}
              }
              // If no likerId from header, try to get from body
              if (!likerId && req.body.userEmail) {
                const likerUser = await prisma.user.findUnique({ where: { email: req.body.userEmail } });
                if (likerUser) likerId = likerUser.id;
              }
              if (likerId && user.id !== likerId) {
                await createNotification({
                  userId: user.id,
                  type: 'like',
                  actorId: likerId,
                  content: 'a aimé votre publication',
                  url: `/posts/${parsedId}`
                });
              }
            }
          }
        } catch (notifErr) {
          console.error('failed to create like notification', notifErr);
        }
        return res.json({ likes: updated.likes });
      }
      if (action === 'unlike') {
        const updated = await prisma.item.update({ where: { id: parsedId }, data: { likes: Math.max(0, (await prisma.item.findUnique({ where: { id: parsedId } })).likes - 1) } });
        return res.json({ likes: updated.likes });
      }
      return res.status(400).json({ error: 'unknown action' });
    } catch (e) {
      console.error('reactions POST error', e);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  res.setHeader('Allow', ['POST']);
  res.status(405).end(`Method ${req.method} Not Allowed`);
}
