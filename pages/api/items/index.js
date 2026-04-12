import prisma from '../../../lib/prisma'

// Augmenter la limite de body pour supporter les images base64
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '50mb',
    },
  },
}

export default async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      try {
        // avoid caching entirely so client always sees latest posts
        res.setHeader('Cache-Control', 'no-store');
        console.log('GET /api/items - Fetching items from database');
        const { sponsorId } = req.query;
        const where = {};
        if (sponsorId) {
          const sid = parseInt(sponsorId, 10);
          if (!isNaN(sid)) where.sponsorId = sid;
        }
        const items = await prisma.item.findMany({ where, orderBy: { createdAt: 'desc' } });
        console.log(`Found ${items.length} items in database`);
        return res.json(items);
      } catch (err) {
        console.error('items GET error', err);
        return res.status(500).json({ error: 'Failed to fetch items' });
      }
    }

    if (req.method === 'POST') {
      try {
        console.log('POST /api/items - Creating new item');
        const { title, content, image, video, backgroundColor, textColor, backgroundImage, author, avatarUrl, authorEmail, sponsorId } = req.body;
        console.log('Request body:', { title, content: content?.substring(0, 50), image: image?.substring(0, 50), video: video?.substring(0, 50), author, sponsorId, backgroundImage: backgroundImage?.substring(0, 50) });

        if (!title) return res.status(400).json({ error: 'title is required' });
        // if this post is associated with a sponsor, ensure authorEmail matches
        // the sponsor owner (if defined) to prevent arbitrary users from posting
        // On ne valide sponsorId que si la publication est une publicité (ex: type === 'ad')
        // Sinon, on ignore sponsorId pour les posts non sponsorisés
        const isAd = req.body?.type === 'ad';
        let sponsorIdToUse = null;
        if (isAd && sponsorId) {
          const sponsorIdInt = typeof sponsorId === 'string' ? parseInt(sponsorId, 10) : sponsorId;
          if (isNaN(sponsorIdInt)) {
            console.error('POST /api/items - sponsorId fourni mais non entier:', sponsorId);
            return res.status(400).json({ error: 'sponsorId must be a valid integer' });
          }
          const sponsorRecord = await prisma.sponsor.findUnique({ where: { id: sponsorIdInt } });
          if (!sponsorRecord) {
            console.error('POST /api/items - sponsorId fourni mais aucun sponsor trouvé:', sponsorIdInt);
            return res.status(400).json({ error: 'Sponsor not found for sponsorId=' + sponsorIdInt });
          }
          if (sponsorRecord.ownerEmail) {
            if (!authorEmail || authorEmail !== sponsorRecord.ownerEmail) {
              return res.status(403).json({ error: 'Not authorized to post on this sponsor page' });
            }
          }
          sponsorIdToUse = sponsorIdInt;
        }
        // Try to create including background fields. If the Prisma client/schema
        // hasn't been migrated/generated yet this can fail — in that case
        // fallback to creating the minimal item (title/content,image) to avoid
        // returning 500 to the client.
        let item;
        try {
          // N'inclure sponsorId que si c'est une publicité (type === 'ad')
          const baseData = {
            title,
            content: content || null,
            image: image || null,
            video: video || null,
            backgroundColor: backgroundColor || null,
            textColor: textColor || null,
            backgroundImage: backgroundImage || null,
            author: author || null,
            avatarUrl: avatarUrl || null,
          };
          if (isAd && sponsorIdToUse) {
            baseData.sponsorId = sponsorIdToUse;
          }
          item = await prisma.item.create({ data: baseData });
        } catch (createErr) {
          console.error('items POST create with background fields failed, retrying minimal create:', createErr);
          // Fallback: create without the new fields
          const minimalData = {
            title,
            content: content || null,
            image: image || null,
            video: video || null,
            author: author || null,
            avatarUrl: avatarUrl || null,
          };
          if (isAd && sponsorIdToUse) {
            minimalData.sponsorId = sponsorIdToUse;
          }
          item = await prisma.item.create({ data: minimalData });
        }

        console.log('Item created successfully:', { id: item.id, title: item.title, author: item.author, createdAt: item.createdAt });

        // after creating a post we can trigger mention notifications
        try {
          const mentionRegex = /@([a-zA-Z0-9_]+)/g;
          let match;
          const mentionedNames = new Set();
          while ((match = mentionRegex.exec(content || '')) !== null) {
            mentionedNames.add(match[1]);
          }
          if (mentionedNames.size > 0) {
            let actorId = null;
            if (authorEmail) {
              const actor = await prisma.user.findUnique({ where: { email: authorEmail } });
              if (actor) actorId = actor.id;
            }
            for (const name of mentionedNames) {
              const mentionedUser = await prisma.user.findUnique({ where: { nomUtilisateur: name } });
              if (mentionedUser && mentionedUser.id !== actorId) {
                await require('../../../lib/notifications').createNotification({
                  userId: mentionedUser.id,
                  type: 'mention',
                  actorId,
                  content: 'a été mentionné dans une publication',
                  url: `/posts/${item.id}`
                });
              }
            }
          }
        } catch (e) {
          console.error('failed to create mention notifications for post', e);
        }

        // Don't cache POST responses
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        return res.status(201).json(item);
      } catch (err) {
        console.error('items POST error:', err.message || err, err.code || '');
        return res.status(500).json({ error: 'Failed to create item', details: err.message || String(err) });
      }
    }

    res.setHeader('Allow', ['GET', 'POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  } catch (err) {
    console.error('Handler error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
