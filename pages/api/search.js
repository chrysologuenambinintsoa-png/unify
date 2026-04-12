import prisma from '../../lib/prisma'

export default async function handler(req, res) {
  const { method } = req

  if (method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { q, type = 'all' } = req.query
    
    if (!q || q.trim().length === 0) {
      return res.status(400).json({ error: 'Query required' })
    }

    const query = q.trim().toLowerCase()
    const results = {
      users: [],
      actualites: [],
      groupes: [],
      pages: []
    }

    // Search users/persons
    if (type === 'all' || type === 'users') {
      const users = await prisma.user.findMany({
        where: {
          OR: [
            { nomUtilisateur: { contains: query } },
            { prenom: { contains: query } },
            { nom: { contains: query } },
            { email: { contains: query } }
          ]
        },
        select: {
          id: true,
          email: true,
          prenom: true,
          nom: true,
          nomUtilisateur: true,
          avatar: true,
          avatarUrl: true
        },
        take: 10
      })
      results.users = users.map(u => ({
        id: u.id,
        name: `${u.prenom} ${u.nom}`,
        username: u.nomUtilisateur,
        avatar: u.avatarUrl || u.avatar,
        email: u.email,
        type: 'user'
      }))
    }

    // Search actualites (posts) - using Item model
    if (type === 'all' || type === 'actualites') {
      const posts = await prisma.item.findMany({
        where: {
          OR: [
            { content: { contains: query } },
            { title: { contains: query } }
          ]
        },
        select: {
          id: true,
          title: true,
          content: true,
          author: true,
          createdAt: true
        },
        take: 5
      })
      results.actualites = posts.map(p => ({
        id: p.id,
        title: p.title || p.content?.substring(0, 100),
        content: p.content?.substring(0, 100),
        author: p.author || 'Anonyme',
        type: 'post'
      }))
    }

    // Search groupes - using Group model
    if (type === 'all' || type === 'groupes') {
      const groupes = await prisma.group.findMany({
        where: {
          OR: [
            { name: { contains: query } },
            { description: { contains: query } }
          ]
        },
        select: {
          id: true,
          name: true,
          description: true,
          cover: true,
          members: true
        },
        take: 5
      })
      results.groupes = groupes.map(g => ({
        id: g.id,
        name: g.name,
        description: g.description?.substring(0, 80),
        image: g.cover,
        memberCount: g.members,
        type: 'groupe'
      }))
    }

    // Search pages
    if (type === 'all' || type === 'pages') {
      const pages = await prisma.page.findMany({
        where: {
          OR: [
            { name: { contains: query } },
            { description: { contains: query } }
          ]
        },
        select: {
          id: true,
          name: true,
          description: true,
          avatar: true,
          followers: true
        },
        take: 5
      })
      results.pages = pages.map(p => ({
        id: p.id,
        name: p.name,
        description: p.description?.substring(0, 80),
        image: p.avatar,
        followerCount: p.followers?.length || 0,
        type: 'page'
      }))
    }

    return res.status(200).json(results)
  } catch (error) {
    console.error('Search error:', error)
    return res.status(500).json({ error: 'Search failed', details: error.message })
  }
}
