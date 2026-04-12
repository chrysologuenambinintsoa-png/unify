import { PrismaClient } from '@prisma/client'
import { promises as fs } from 'fs'
import path from 'path'
import formidable from 'formidable'

const prisma = new PrismaClient()

// Désactiver le body parser par défaut (pour FormData)
export const config = {
  api: {
    bodyParser: false,
  },
}

// Parser FormData ou JSON selon le content-type
async function parseRequest(req) {
  const contentType = req.headers['content-type'] || ''
  
  // Parser FormData
  if (contentType.includes('multipart/form-data')) {
    const form = formidable({
      uploadDir: path.join(process.cwd(), 'public/uploads/groups'),
      keepExtensions: true,
      maxFileSize: 10 * 1024 * 1024, // 10MB
    })
    
    // Créer le dossier si nécessaire
    try {
      await fs.mkdir(form.uploadDir, { recursive: true })
    } catch (e) {
      // Dossier existe déjà
    }
    
    const [fields, files] = await form.parse(req)
    
    // Convertir les arrays formidable en objets simples
    const data = {}
    Object.entries(fields).forEach(([key, value]) => {
      data[key] = value?.[0] || value
    })
    
    // Gérer les fichiers
    const fileData = {}
    Object.entries(files).forEach(([key, value]) => {
      fileData[key] = value?.[0] || value
    })
    
    return { data, files: fileData, isMultipart: true }
  }
  
  // Parser JSON
  return new Promise((resolve, reject) => {
    let body = ''
    req.on('data', chunk => {
      body += chunk.toString()
    })
    req.on('end', () => {
      try {
        const data = body ? JSON.parse(body) : {}
        resolve({ data, files: {}, isMultipart: false })
      } catch (e) {
        resolve({ data: {}, files: {}, isMultipart: false })
      }
    })
    req.on('error', reject)
  })
}

export default async function handler(req, res) {
  const { method } = req
  let { userEmail, action, groupId, name: nameParam } = req.query

  try {
    // Parser la requête
    const { data: bodyData, files: uploadedFiles, isMultipart } = await parseRequest(req)

    // Pour POST, récupérer userEmail depuis le body (FormData) en priorité
    if (req.method === 'POST') {
      userEmail = bodyData.userEmail || userEmail;
    }

    // Utiliser name du query ou du body/form
    const name = nameParam || bodyData.name || bodyData.name?.[0]

    switch (method) {
      case 'GET':
        if (groupId) {
          // Get single group
          const group = await prisma.group.findUnique({
            where: { id: parseInt(groupId) }
          })
          if (!group) return res.status(404).json({ error: 'Groupe non trouvé' })

          // Parse members list
          let membersList = []
          try {
            membersList = group.membersList ? JSON.parse(group.membersList) : []
          } catch (e) {
            console.error('Error parsing membersList:', e)
            membersList = []
          }
          const isMember = membersList.includes(userEmail)

          return res.status(200).json({
            groupe: {
              ...group,
              joined: isMember,
              members: group.members
            }
          })
        } else {
          // Get user's groups - allow empty userEmail for public access
          let user = null
          if (userEmail) {
            user = await prisma.user.findUnique({
              where: { email: userEmail }
            })
          }

          const groupes = await prisma.group.findMany()

          const groupesWithMembership = groupes.map(g => {
            let membersList = []
            try {
              membersList = g.membersList ? JSON.parse(g.membersList) : []
            } catch (e) {
              console.error('Error parsing membersList:', e)
              membersList = []
            }
            return {
              ...g,
              members: g.members,
              joined: userEmail ? membersList.includes(userEmail) || false : false
            }
          })

          return res.status(200).json({ groupes: groupesWithMembership })
        }

      case 'POST':
        // Create group
        console.log('POST /api/groupes - Creating group with:', { name, userEmail, isMultipart, bodyData });
        
        // Validate input
        if (!name || name.trim() === '') {
          return res.status(400).json({ error: 'Le nom du groupe est requis' });
        }
        if (!userEmail) {
          return res.status(400).json({ error: 'L\'email utilisateur est requis' });
        }
        
        const user = await prisma.user.findUnique({ where: { email: userEmail } })
        if (!user) return res.status(404).json({ error: 'Utilisateur non trouvé' })

        try {
          // Gérer le fichier image s'il existe
          let coverImagePath = ''
          if (uploadedFiles.coverImage) {
            coverImagePath = `/uploads/groups/${path.basename(uploadedFiles.coverImage.filepath)}`
            console.log('Image uploaded to:', coverImagePath)
          }

          // Ensure description and tags are strings, not arrays
          const description = Array.isArray(bodyData.description) 
            ? bodyData.description[0] || '' 
            : (bodyData.description || '');
          const tags = Array.isArray(bodyData.tags) 
            ? bodyData.tags[0] || '' 
            : (bodyData.tags || '');

          const newGroup = await prisma.group.create({
            data: {
              name: name.trim(),
              description: description,
              coverIcon: bodyData.coverIcon || '',
              cover: coverImagePath || bodyData.cover || bodyData.coverImage || '',
              category: bodyData.category || '',
              privacy: bodyData.privacy || 'public',
              members: 1,
              membersList: JSON.stringify([userEmail])
            }
          })

          console.log('Group created successfully:', newGroup.id);
          return res.status(201).json({ groupe: newGroup })
        } catch (prismaError) {
          console.error('Prisma error creating group:', prismaError);
          return res.status(500).json({ error: 'Erreur lors de la création du groupe: ' + prismaError.message });
        }

      case 'PUT':
        if (action === 'join') {
          const user = await prisma.user.findUnique({ where: { email: userEmail } })
          if (!user) return res.status(404).json({ error: 'Utilisateur non trouvé' })

          const group = await prisma.group.findUnique({ where: { id: parseInt(groupId) } })
          if (!group) return res.status(404).json({ error: 'Groupe non trouvé' })

          let membersList = []
          try {
            membersList = group.membersList ? JSON.parse(group.membersList) : []
          } catch (e) {
            console.error('Error parsing membersList:', e)
            membersList = []
          }
          if (!membersList.includes(userEmail)) {
            membersList.push(userEmail)
            await prisma.group.update({
              where: { id: parseInt(groupId) },
              data: {
                members: membersList.length,
                membersList: JSON.stringify(membersList)
              }
            })
          }

          return res.status(200).json({ success: true })
        }

        if (action === 'leave') {
          const user = await prisma.user.findUnique({ where: { email: userEmail } })
          if (!user) return res.status(404).json({ error: 'Utilisateur non trouvé' })

          const group = await prisma.group.findUnique({ where: { id: parseInt(groupId) } })
          if (!group) return res.status(404).json({ error: 'Groupe non trouvé' })

          let membersList = []
          try {
            membersList = group.membersList ? JSON.parse(group.membersList) : []
          } catch (e) {
            console.error('Error parsing membersList:', e)
            membersList = []
          }
          const updatedMembers = membersList.filter(email => email !== userEmail)

          await prisma.group.update({
            where: { id: parseInt(groupId) },
            data: {
              members: updatedMembers.length,
              membersList: JSON.stringify(updatedMembers)
            }
          })

          return res.status(200).json({ success: true })
        }

        if (action === 'updatePrivacy') {
          // Note: privacy field doesn't exist in current schema
          // This would need to be added to the Group model
          return res.status(400).json({ error: 'Fonctionnalité non implémentée' })
        }

        return res.status(400).json({ error: 'Action non reconnue' })

      default:
        res.setHeader('Allow', ['GET', 'POST', 'PUT'])
        return res.status(405).json({ error: `Méthode ${method} non autorisée` })
    }
  } catch (error) {
    console.error(error)
    return res.status(500).json({ error: 'Erreur serveur' })
  }
}