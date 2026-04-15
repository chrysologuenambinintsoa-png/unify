import prisma from '../../../../../lib/prisma'

export default async function handler(req, res) {
  const {
    query: { id, postId },
    method,
  } = req;

  if (!id || !postId) {
    return res.status(400).json({ error: 'Page ID et Post ID requis' });
  }

  switch (method) {
    case 'GET':
      try {
        // Recherche du post unique pour la page
        const post = await prisma.pagePost.findFirst({
          where: {
            id: Number(postId),
            pageId: Number(id),
          },
        });
        if (!post) return res.status(404).json({ error: 'Post non trouvé' });
        return res.status(200).json(post);
      } catch (e) {
        return res.status(500).json({ error: e.message });
      }
    case 'DELETE':
      try {
        // Prisma ne permet pas de delete avec deux conditions dans where, il faut utiliser id uniquement
        // On vérifie d'abord que le post appartient bien à la page
        const post = await prisma.pagePost.findFirst({
          where: {
            id: Number(postId),
            pageId: Number(id),
          },
        });
        if (!post) return res.status(404).json({ error: 'Post non trouvé' });
        const deleted = await prisma.pagePost.delete({
          where: { id: Number(postId) },
        });
        return res.status(200).json(deleted);
      } catch (e) {
        return res.status(500).json({ error: e.message });
      }
    default:
      res.setHeader('Allow', ['GET', 'DELETE']);
      return res.status(405).end(`Method ${method} Not Allowed`);
  }
}
