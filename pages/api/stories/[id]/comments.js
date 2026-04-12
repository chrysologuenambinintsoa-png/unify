import prisma from '../../../../lib/prisma'
import { createNotification } from '../../../../lib/notifications'

export default async function handler(req, res) {
  const { id } = req.query
  const userStr = req.headers['x-user-id']

  if (!id) {
    return res.status(400).json({ error: 'Story ID required' })
  }

  // GET comments for a story
  if (req.method === 'GET') {
    try {
      const comments = await prisma.storyComment.findMany({
        where: { storyId: id },
        include: {
          author: {
            select: {
              id: true,
              prenom: true,
              nom: true,
              avatar: true,
              avatarUrl: true,
              email: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      })

      return res.status(200).json(comments)
    } catch (error) {
      console.error('Error fetching story comments:', error)
      return res.status(500).json({ error: 'Failed to fetch comments' })
    }
  }

  // POST new comment
  if (req.method === 'POST') {
    if (!userStr) {
      return res.status(401).json({ error: 'Not authenticated' })
    }

    try {
      const user = typeof userStr === 'string' ? JSON.parse(userStr) : userStr
      const { text } = req.body

      if (!text || !text.trim()) {
        return res.status(400).json({ error: 'Comment text required' })
      }
      // Vérifier que l'utilisateur existe dans la base de données
      const existingUser = await prisma.user.findUnique({
        where: { id: user.id }
      });

      if (!existingUser) {
        return res.status(404).json({ error: 'Utilisateur non trouvé' });
      }
      // Verify story exists
      const story = await prisma.story.findUnique({
        where: { id },
        select: { id: true }
      })

      if (!story) {
        return res.status(404).json({ error: 'Story not found' })
      }

      // Create comment
      const newComment = await prisma.storyComment.create({
        data: {
          storyId: id,
          authorId: user.id,
          text: text.trim()
        },
        include: {
          author: {
            select: {
              id: true,
              prenom: true,
              nom: true,
              avatar: true,
              avatarUrl: true,
              email: true
            }
          }
        }
      })

      // Increment story comments count
      await prisma.story.update({
        where: { id },
        data: { comments: { increment: 1 } }
      })

      // notify story author
      try {
        const storyData = await prisma.story.findUnique({ where: { id } })
        if (storyData && storyData.authorId && storyData.authorId !== user.id) {
          await createNotification({
            userId: storyData.authorId,
            type: 'comment',
            actorId: user.id,
            content: 'a commenté votre story',
            url: `/stories/${id}`
          })
        }
      } catch (e) {
        console.error('story comment notification failed', e)
      }

      // detect @mentions in story comment text
      try {
        const mentionRegex = /@([a-zA-Z0-9_]+)/g;
        let match;
        const mentionedNames = new Set();
        while ((match = mentionRegex.exec(text)) !== null) {
          mentionedNames.add(match[1]);
        }
        if (mentionedNames.size > 0) {
          for (const name of mentionedNames) {
            const mentionedUser = await prisma.user.findUnique({ where: { nomUtilisateur: name } });
            if (mentionedUser && mentionedUser.id !== user.id) {
              await createNotification({
                userId: mentionedUser.id,
                type: 'mention',
                actorId: user.id,
                content: 'a mentionné',
                url: `/stories/${id}`
              });
            }
          }
        }
      } catch (e) {
        console.error('failed to create mention notifications for story comment', e);
      }

      return res.status(201).json(newComment)
    } catch (error) {
      console.error('Error creating comment:', error)
      return res.status(500).json({ error: 'Failed to create comment' })
    }
  }

  return res.status(405).json({ error: 'Method not allowed' })
}