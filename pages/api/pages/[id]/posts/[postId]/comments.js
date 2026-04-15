import { PrismaClient } from '@prisma/client'
import fs from 'fs'
import path from 'path'

const prisma = new PrismaClient()

export const config = {
  api: {
    bodyParser: false,
  },
}

export default async function handler(req, res) {
  const { id: pageId, postId } = req.query
  const parsedPostId = parseInt(postId, 10)
  
  if (Number.isNaN(parsedPostId)) {
    return res.status(400).json({ error: 'Invalid post id' })
  }

  if (req.method === 'GET') {
    try {
      return res.json([])
    } catch (e) {
      console.error('comments GET error', e)
      return res.status(500).json({ error: 'Internal server error' })
    }
  }

  if (req.method === 'POST') {
    try {
      const contentType = req.headers['content-type'] || ''
      
      let text = ''
      let authorEmail = ''
      let parentId = null
      let imageUrl = ''
      
      if (contentType.includes('multipart/form-data')) {
        const chunks = []
        for await (const chunk of req) {
          chunks.push(chunk)
        }
        const bodyBuffer = Buffer.concat(chunks)
        const boundary = contentType.split('boundary=')[1]
        
        const parts = bodyBuffer.toString('latin1').split(`--${boundary}`).filter(p => p.trim() && !p.startsWith('--'))
        
        for (const part of parts) {
          if (part.includes('name="text"')) {
            const match = part.match(/name="text"\r\n\r\n([^\r\n]+)/)
            if (match) text = match[1]
          }
          if (part.includes('name="authorEmail"')) {
            const match = part.match(/name="authorEmail"\r\n\r\n([^\r\n]+)/)
            if (match) authorEmail = match[1]
          }
          if (part.includes('name="parentId"')) {
            const match = part.match(/name="parentId"\r\n\r\n([^\r\n]+)/)
            if (match && match[1]) parentId = parseInt(match[1], 10)
          }
          if (part.includes('filename="') && part.includes('name="image"')) {
            const headerEnd = part.indexOf('\r\n\r\n')
            if (headerEnd > 0) {
              const base64Data = part.slice(headerEnd + 4).replace(/\r\n/g, '').replace(/-+$/, '')
              if (base64Data.length > 0) {
                try {
                  const imageBuffer = Buffer.from(base64Data, 'base64')
                  const dir = path.join(process.cwd(), 'public', 'uploads', 'comments')
                  if (!fs.existsSync(dir)) {
                    fs.mkdirSync(dir, { recursive: true })
                  }
                  const filename = `comment-${Date.now()}.jpg`
                  const imagePath = path.join(dir, filename)
                  fs.writeFileSync(imagePath, imageBuffer)
                  imageUrl = `/uploads/comments/${filename}`
                } catch (imgErr) {
                  console.error('Image save error:', imgErr)
                }
              }
            }
          }
        }
      } else {
        const chunks = []
        for await (const chunk of req) {
          chunks.push(chunk)
        }
        const bodyString = Buffer.concat(chunks).toString()
        try {
          const data = bodyString ? JSON.parse(bodyString) : {}
          text = data.text || ''
          authorEmail = data.authorEmail || ''
          parentId = data.parentId ? parseInt(data.parentId, 10) : null
        } catch (parseErr) {
          text = ''
        }
      }
      
      if (!text.trim() && !imageUrl) {
        return res.status(400).json({ error: 'Comment text or image is required' })
      }

      const commentId = Date.now()
      
      return res.json({
        id: commentId,
        pagePostId: parsedPostId,
        authorEmail: authorEmail || 'Anonymous',
        text: text.trim(),
        parentId: parentId || null,
        likes: 0,
        image: imageUrl || '',
        createdAt: new Date().toISOString()
      })
    } catch (e) {
      console.error('comments POST error', e)
      return res.status(500).json({ error: e.message || 'Internal server error' })
    }
  }

  res.setHeader('Allow', ['GET', 'POST'])
  res.status(405).end(`Method ${req.method} Not Allowed`)
}
