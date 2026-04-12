import prisma from '../../../lib/prisma';
import { getUserFromToken } from '../../../lib/auth'
import { createNotification } from '../../../lib/notifications'
import nodemailer from 'nodemailer'

async function sendApprovalEmail(toEmail, firstName, approved) {
  const smtpHost = process.env.SMTP_HOST
  if (!smtpHost) return // no smtp configured

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  })

  const subject = approved ? 'Votre compte vendeur a été activé' : 'Votre compte vendeur a été révoqué'
  const text = approved
    ? `Bonjour ${firstName || ''},\n\nVotre compte vendeur a été activé. Vous pouvez désormais publier des articles sur le marketplace.`
    : `Bonjour ${firstName || ''},\n\nVotre accès vendeur a été révoqué. Si vous pensez qu'il s'agit d'une erreur, contactez le support.`

  try {
    await transporter.sendMail({ from: process.env.SMTP_FROM || 'no-reply@unify.local', to: toEmail, subject, text })
  } catch (e) {
    console.error('Failed to send approval email', e)
  }
}

export default async function handler(req, res) {
  const { method } = req

  // auth: require Authorization header Bearer <token>
  const authHeader = req.headers.authorization || req.headers.Authorization
  if (!authHeader) return res.status(401).json({ error: 'Unauthorized' })
  const token = authHeader.replace(/^Bearer\s+/i, '')
  const currentUser = await getUserFromToken(token)
  if (!currentUser) return res.status(401).json({ error: 'Invalid token' })

  // admin check: allow if user has isAdmin true OR is in ADMIN_EMAILS env
  const adminEmails = (process.env.ADMIN_EMAILS || '').split(',').map(s => s.trim()).filter(Boolean)
  const isAdmin = !!currentUser.isAdmin || adminEmails.includes(currentUser.email)
  if (!isAdmin) return res.status(403).json({ error: 'Forbidden' })

  try {
    if (method === 'GET') {
      const users = await prisma.user.findMany({
        orderBy: { createdAt: 'desc' },
        select: {
          email: true,
          prenom: true,
          nom: true,
          nomUtilisateur: true,
          avatarUrl: true,
          isApprovedSeller: true,
          createdAt: true
        }
      })

      return res.status(200).json({ users })
    }

    if (method === 'PUT') {
      const { email, approve } = req.body
      if (!email || typeof approve !== 'boolean') {
        return res.status(400).json({ error: 'Missing parameters' })
      }

      const user = await prisma.user.update({ where: { email }, data: { isApprovedSeller: approve } })

      // create an in-app notification
      try {
        await createNotification({ userId: user.id, type: 'seller_status_change', actorId: currentUser.id, content: approve ? 'Votre compte vendeur a été activé' : 'Votre compte vendeur a été révoqué' })
      } catch (e) {
        console.error('Failed to create notification', e)
      }

      // send an email if SMTP configured
      try {
        await sendApprovalEmail(user.email, user.prenom || user.nomUtilisateur || '', approve)
      } catch (e) {
        console.error('Error sending approval email', e)
      }

      return res.status(200).json({ user })
    }
  } catch (e) {
    console.error('Admin sellers API error', e)
    return res.status(500).json({ error: 'Internal server error' })
  }

  res.setHeader('Allow', ['GET', 'PUT'])
  res.status(405).end(`Method ${method} Not Allowed`)
}
