import prisma from '../../../../lib/prisma'
import { createNotification } from '../../../../lib/notifications'

export default async function handler(req, res) {
  const { id } = req.query;
  const parsedId = parseInt(id, 10);
  if (Number.isNaN(parsedId)) return res.status(400).json({ error: 'Invalid id' });

  if (req.method === 'GET') {
    // include replies and likes
    const comments = await prisma.comment.findMany({
      where: { postId: parsedId },
      orderBy: { createdAt: 'asc' }
    });

    // enrich comments with author data
    const enrichedComments = await Promise.all(
      comments.map(async (comment) => {
        const authorUser = await prisma.user.findUnique({
          where: { email: comment.author },
          select: {
            id: true,
            email: true,
            prenom: true,
            nom: true,
            avatar: true,
            avatarUrl: true
          }
        });
        return {
          ...comment,
          authorUser: authorUser || null
        };
      })
    );
    
    return res.json(enrichedComments);
  }

  if (req.method === 'POST') {
    const { author, text, parentId, authorEmail } = req.body;
    if (!text) return res.status(400).json({ error: 'text is required' });
    const data = { postId: parsedId, author: author || 'Anonymous', text };
    if (parentId) data.parentId = parentId;
    const comment = await prisma.comment.create({ data });

    // create notification for post author
    try {
      const item = await prisma.item.findUnique({ where: { id: parsedId } });
      if (item) {
        // Try to find post owner by email first, then by username
        let postOwner = null;
        if (item.author) {
          postOwner = await prisma.user.findUnique({ where: { email: item.author } });
          if (!postOwner) {
            postOwner = await prisma.user.findUnique({ where: { nomUtilisateur: item.author } });
          }
        }
        if (postOwner) {
          // try to find commenter by email to set actorId
          let commenterId = null;
          if (authorEmail) {
            const commenterUser = await prisma.user.findUnique({ where: { email: authorEmail } });
            if (commenterUser) commenterId = commenterUser.id;
          }
          
          await createNotification({
            userId: postOwner.id,
            type: parentId ? 'reply' : 'comment',
            actorId: commenterId,
            content: parentId ? 'a répondu à un commentaire' : 'a commenté votre publication',
            url: `/posts/${parsedId}`
          });
        }
      }
    } catch (e) {
      console.error('failed to create comment notification', e);
    }

    // if reply, also notify parent comment author
    if (parentId) {
      try {
        const parent = await prisma.comment.findUnique({ where: { id: parentId } });
        if (parent && parent.author) {
          // Try to find parent comment author by email first, then by username
          let parentOwner = await prisma.user.findUnique({ where: { email: parent.author } });
          if (!parentOwner) {
            parentOwner = await prisma.user.findUnique({ where: { nomUtilisateur: parent.author } });
          }
          if (parentOwner) {
            let commenterId = null;
            if (authorEmail) {
              const commenterUser = await prisma.user.findUnique({ where: { email: authorEmail } });
              if (commenterUser) commenterId = commenterUser.id;
            }
            
            await createNotification({
              userId: parentOwner.id,
              type: 'reply',
              actorId: commenterId,
              content: 'a répondu à votre commentaire',
              url: `/posts/${parsedId}`
            });
          }
        }
      } catch (e) {
        console.error('failed to notify parent comment author', e);
      }
    }

    // detect any @mentions and notify the mentioned users (excluding the author)
    try {
      const mentionRegex = /@([a-zA-Z0-9_]+)/g;
      let match;
      const mentionedNames = new Set();
      while ((match = mentionRegex.exec(text)) !== null) {
        mentionedNames.add(match[1]);
      }
      if (mentionedNames.size > 0) {
        let commenterId = null;
        if (authorEmail) {
          const commenterUser = await prisma.user.findUnique({ where: { email: authorEmail } });
          if (commenterUser) commenterId = commenterUser.id;
        }
        for (const name of mentionedNames) {
          const mentionedUser = await prisma.user.findUnique({ where: { nomUtilisateur: name } });
          if (mentionedUser && mentionedUser.id !== commenterId) {
            await createNotification({
              userId: mentionedUser.id,
              type: 'mention',
              actorId: commenterId,
              content: 'a mentionné',
              url: `/posts/${parsedId}`
            });
          }
        }
      }
    } catch (e) {
      console.error('failed to create mention notifications', e);
    }

    // enrich the newly created comment with authorUser data so clients can display avatars
    const authorUserAfter = await prisma.user.findUnique({
      where: { email: comment.author },
      select: {
        id: true,
        email: true,
        prenom: true,
        nom: true,
        avatar: true,
        avatarUrl: true
      }
    });
    const responseComment = {
      ...comment,
      authorUser: authorUserAfter || null
    };
    return res.status(201).json(responseComment);
  }

  res.setHeader('Allow', ['GET', 'POST']);
  res.status(405).end(`Method ${req.method} Not Allowed`);
}
