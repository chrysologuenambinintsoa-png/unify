import prisma from '../../../lib/prisma';

// Augmenter la limite de body pour supporter les images base64
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '50mb',
    },
  },
};

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      // Récupérer les stories des dernières 24h
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

      const stories = await prisma.story.findMany({
        where: {
          createdAt: {
            gte: twentyFourHoursAgo
          }
        },
        include: {
          author: {
            select: {
              id: true,
              prenom: true,
              nom: true,
              email: true,
              avatar: true,
              avatarUrl: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: 10 // Limiter à 10 stories
      });

      return res.status(200).json(stories);
    } catch (error) {
      console.error('Error fetching stories:', error);
      return res.status(500).json({ error: 'Failed to fetch stories' });
    }
  }

  if (req.method === 'POST') {
    try {
      const { content, image, visibility } = req.body;
      const userStr = req.headers['x-user-id'];

      if (!userStr) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      let authorId;
      try {
        const user = typeof userStr === 'string' ? JSON.parse(userStr) : userStr;
        authorId = typeof user.id === 'string' ? parseInt(user.id, 10) : user.id;
        
        if (isNaN(authorId)) {
          return res.status(400).json({ error: 'Invalid user ID format' });
        }
      } catch {
        return res.status(400).json({ error: 'Invalid user data' });
      }

      // Vérifier que l'utilisateur existe dans la base de données
      const existingUser = await prisma.user.findUnique({
        where: { id: authorId }
      });

      if (!existingUser) {
        return res.status(404).json({ error: 'Utilisateur non trouvé' });
      }

      const story = await prisma.story.create({
        data: {
          authorId,
          content,
          image,
          visibility: visibility || 'public'
        },
        include: {
          author: {
            select: {
              id: true,
              prenom: true,
              nom: true,
              email: true,
              avatar: true,
              avatarUrl: true
            }
          }
        }
      });

      return res.status(201).json(story);
    } catch (error) {
      console.error('Error creating story:', error);
      return res.status(500).json({ error: 'Failed to create story' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
