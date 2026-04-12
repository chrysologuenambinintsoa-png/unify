import prisma from '../../lib/prisma'
import { createNotification } from '../../lib/notifications'

export default async function handler(req, res) {
  const { method } = req
  // Support both query params and body for POST requests
  const userEmail = req.query.userEmail || (req.body && req.body.userEmail)
  const friendId = req.query.friendId || (req.body && req.body.friendId)
  const action = req.query.action || (req.body && req.body.action)

  try {
    if (method === 'GET') {
      // Get friends, requests, and suggestions
      if (!userEmail && !req.query.userId) return res.status(400).json({ error: 'userEmail or userId required' })

      let user
      if (req.query.userId) {
        user = await prisma.user.findUnique({
          where: { id: parseInt(req.query.userId, 10) },
          include: {
            friendsOf: { include: { friend: true } },
            friendsWith: { include: { user: true } }
          }
        })
      } else {
        user = await prisma.user.findUnique({
          where: { email: userEmail },
          include: {
            friendsOf: { include: { friend: true } },
            friendsWith: { include: { user: true } }
          }
        })
      }

      if (!user) return res.status(404).json({ error: 'User not found' })

      // Amis acceptés
      // Fusionner les deux listes et supprimer les doublons par id
      const amisRaw = [
        ...user.friendsOf.filter(f => f.status === 'accepted').map(f => ({
          id: f.friend.id,
          email: f.friend.email,
          prenom: f.friend.prenom,
          nom: f.friend.nom,
          nomUtilisateur: f.friend.nomUtilisateur,
          name: `${f.friend.prenom} ${f.friend.nom}`,
          avatar: f.friend.avatar || (f.friend.prenom ? f.friend.prenom[0] : ''),
          avatarUrl: f.friend.avatarUrl,
          status: f.status
        })),
        ...user.friendsWith.filter(f => f.status === 'accepted').map(f => ({
          id: f.user.id,
          email: f.user.email,
          prenom: f.user.prenom,
          nom: f.user.nom,
          nomUtilisateur: f.user.nomUtilisateur,
          name: `${f.user.prenom} ${f.user.nom}`,
          avatar: f.user.avatar || (f.user.prenom ? f.user.prenom[0] : ''),
          avatarUrl: f.user.avatarUrl,
          status: f.status
        }))
      ];
      // Supprimer les doublons par id
      const amis = Object.values(amisRaw.reduce((acc, ami) => {
        acc[ami.id] = ami;
        return acc;
      }, {}));

      // Demandes reçues (pending où friendId = user.id)
      const demandesRecues = user.friendsWith.filter(f => f.status === 'pending').map(f => ({
        id: f.user.id,
        email: f.user.email,
        prenom: f.user.prenom,
        nom: f.user.nom,
        nomUtilisateur: f.user.nomUtilisateur,
        name: `${f.user.prenom} ${f.user.nom}`,
        avatar: f.user.avatar || (f.user.prenom ? f.user.prenom[0] : ''),
        avatarUrl: f.user.avatarUrl,
        status: f.status
      }))

      // Demandes envoyées (pending où userId = user.id)
      const demandesEnvoyees = user.friendsOf.filter(f => f.status === 'pending').map(f => ({
        id: f.friend.id,
        email: f.friend.email,
        prenom: f.friend.prenom,
        nom: f.friend.nom,
        nomUtilisateur: f.friend.nomUtilisateur,
        name: `${f.friend.prenom} ${f.friend.nom}`,
        avatar: f.friend.avatar || (f.friend.prenom ? f.friend.prenom[0] : ''),
        avatarUrl: f.friend.avatarUrl,
        status: f.status
      }))

      // Suggestions (ni amis, ni pending)
      const excludeIds = new Set([
        user.id,
        ...amis.map(a => a.id),
        ...demandesRecues.map(a => a.id),
        ...demandesEnvoyees.map(a => a.id)
      ])
      const others = await prisma.user.findMany({
        where: {
          id: { notIn: Array.from(excludeIds) }
        },
        take: 20
      })
      const suggestions = others.map(u => ({
        id: u.id,
        email: u.email,
        prenom: u.prenom,
        nom: u.nom,
        nomUtilisateur: u.nomUtilisateur,
        name: `${u.prenom} ${u.nom}`,
        avatar: u.avatar || (u.prenom ? u.prenom[0] : '') || (u.nom ? u.nom[0] : ''),
        avatarUrl: u.avatarUrl,
        mutualFriends: 0
      }))

      return res.status(200).json({ amis, suggestions, demandesRecues, demandesEnvoyees })
    }

    if (method === 'POST') {
      if (!userEmail) return res.status(400).json({ error: 'userEmail required' })

      const user = await prisma.user.findUnique({ where: { email: userEmail } })
      if (!user) return res.status(404).json({ error: 'User not found' })

      if (action === 'add' && friendId) {
        const targetId = parseInt(friendId)
        // Vérifier si une demande existe déjà
        const existing = await prisma.friendship.findFirst({
          where: {
            userId: user.id,
            friendId: targetId
          }
        })
        if (existing) {
          return res.status(400).json({ error: 'Demande déjà envoyée' })
        }
        const friendship = await prisma.friendship.create({
          data: {
            userId: user.id,
            friendId: targetId,
            status: 'pending'
          }
        })
        // Notifier le destinataire
        try {
          const other = await prisma.user.findUnique({ where: { id: targetId } })
          if (other) {
            await createNotification({
              userId: other.id,
              type: 'friend-request',
              actorId: user.id,
              content: `${user.prenom || user.nomUtilisateur || user.email} vous a envoyé une demande d'ami`,
              url: '/amis'
            })
          }
        } catch (e) {
          console.error('friend notification error', e)
        }
        return res.status(201).json({ success: true, friendship })
      }

      // Accept/refuse une demande d'ami
      if ((action === 'accept' || action === 'refuse') && friendId) {
        const targetId = parseInt(friendId)
        // Trouver la demande reçue (user est le destinataire)
        const demande = await prisma.friendship.findFirst({
          where: {
            userId: targetId,
            friendId: user.id,
            status: 'pending'
          }
        })
        if (!demande) return res.status(404).json({ error: 'Demande non trouvée' })
        if (action === 'accept') {
          await prisma.friendship.update({
            where: { id: demande.id },
            data: { status: 'accepted' }
          })
          // Créer la réciprocité
          await prisma.friendship.create({
            data: {
              userId: user.id,
              friendId: targetId,
              status: 'accepted'
            }
          })
          // Notifier l'expéditeur
          try {
            await createNotification({
              userId: targetId,
              type: 'friend-accepted',
              actorId: user.id,
              content: `${user.prenom || user.nomUtilisateur || user.email} a accepté votre demande`,
              url: '/amis'
            })
          } catch (e) { console.error('notif accept error', e) }
          return res.status(200).json({ success: true, accepted: true })
        } else if (action === 'refuse') {
          await prisma.friendship.update({
            where: { id: demande.id },
            data: { status: 'declined' }
          })
          // Optionnel: notifier le demandeur du refus
          return res.status(200).json({ success: true, refused: true })
        }
      }

      if (action === 'remove' && friendId) {
        await prisma.friendship.deleteMany({
          where: {
            OR: [
              { userId: user.id, friendId: parseInt(friendId) },
              { userId: parseInt(friendId), friendId: user.id }
            ]
          }
        })
        return res.status(200).json({ success: true })
      }

      return res.status(400).json({ error: 'Invalid action' })
    }

    res.setHeader('Allow', ['GET', 'POST'])
    res.status(405).end(`Method ${method} Not Allowed`)
  } catch (err) {
    console.error('Friends API error', err)
    res.status(500).json({ error: err.message })
  }
}
