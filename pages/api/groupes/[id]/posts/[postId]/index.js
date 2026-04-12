import prisma from 'lib/prisma'
import fs from 'fs'
import path from 'path'
import jwt from 'jsonwebtoken'
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret'

// Fonction pour vérifier le token et obtenir l'utilisateur
async function getUserFromToken(req) {
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null
  }
  
  try {
    const token = authHeader.split(' ')[1]
    const decoded = jwt.verify(token, JWT_SECRET)
    if (!decoded || !decoded.userId) {
      return null
    }
    
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId }
    })
    return user
  } catch (err) {
    console.error('Token verification failed:', err.message)
    return null
  }
}

export default async function handler(req, res) {
  const { id, postId } = req.query;
  const parsedGroupId = parseInt(id, 10);
  const parsedPostId = parseInt(postId, 10);
  
  if (Number.isNaN(parsedGroupId)) return res.status(400).json({ error: 'Invalid group id' });
  if (Number.isNaN(parsedPostId)) return res.status(400).json({ error: 'Invalid post id' });

  if (req.method === 'DELETE') {
    try {
      // Verify user is authenticated
      const user = await getUserFromToken(req)
      if (!user) return res.status(401).json({ error: 'Non autorisé. Token requis.' })
      
      // Verify post exists and belongs to the group
      const post = await prisma.post.findFirst({
        where: { 
          id: parsedPostId,
          groupId: parsedGroupId
        }
      });
      
      if (!post) return res.status(404).json({ error: 'Post not found in this group' });
      
      // Verify user is the author of the post
      if (post.authorId !== user.id) {
        return res.status(403).json({ error: 'Non autorisé à supprimer ce post' })
      }
      
      // Delete associated media file if exists
      if (post.image) {
        try {
          const filePath = path.join(process.cwd(), 'public', post.image);
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }
        } catch (e) {
          console.error('Failed to delete media file:', e);
          // Continue with post deletion even if file deletion fails
        }
      }
      
      // Delete all comments associated with the post
      await prisma.comment.deleteMany({
        where: { postId: parsedPostId }
      });
      
      // Delete the post
      await prisma.post.delete({
        where: { id: parsedPostId }
      });
      
      return res.status(200).json({ message: 'Post deleted successfully' });
    } catch (error) {
      console.error('Error deleting post:', error);
      return res.status(500).json({ error: 'Erreur lors de la suppression du post' });
    }
  }

  if (req.method === 'GET') {
    try {
      // Get a single post
      const post = await prisma.post.findFirst({
        where: { 
          id: parsedPostId,
          groupId: parsedGroupId
        },
        include: { author: true }
      });
      
      if (!post) return res.status(404).json({ error: 'Post not found in this group' });
      
      return res.status(200).json({ post });
    } catch (error) {
      console.error('Error fetching post:', error);
      return res.status(500).json({ error: 'Erreur lors de la récupération du post' });
    }
  }

  res.setHeader('Allow', ['GET', 'DELETE']);
  res.status(405).end(`Method ${req.method} Not Allowed`);
}
