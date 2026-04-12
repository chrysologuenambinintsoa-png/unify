import Stripe from 'stripe'
import prisma from '../../../lib/prisma'
import { createNotification } from '../../../lib/notifications'
import nodemailer from 'nodemailer'

export const config = { api: { bodyParser: false } }

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', { apiVersion: '2022-11-15' })

async function sendApprovalEmail(toEmail, firstName) {
  const smtpHost = process.env.SMTP_HOST
  if (!smtpHost) return

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  })

  const subject = 'Votre compte vendeur a été activé'
  const text = `Bonjour ${firstName || ''},\n\nVotre paiement a bien été reçu et votre compte vendeur est désormais activé sur Unify. Vous pouvez publier des articles.\n\n— L'équipe Unify`;

  try {
    await transporter.sendMail({ from: process.env.SMTP_FROM || 'no-reply@unify.local', to: toEmail, subject, text })
  } catch (e) {
    console.error('Failed to send approval email', e)
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST'])
    return res.status(405).end('Method Not Allowed')
  }

  const sig = req.headers['stripe-signature'] || req.headers['Stripe-Signature']
  if (!sig) return res.status(400).end('Missing stripe signature')
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  if (!webhookSecret) return res.status(500).json({ error: 'Webhook secret not configured' })

  // read raw body
  const chunks = []
  for await (const chunk of req) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk)
  }
  const buf = Buffer.concat(chunks)

  let event
  try {
    event = stripe.webhooks.constructEvent(buf, sig, webhookSecret)
  } catch (err) {
    console.error('Webhook signature verification failed', err.message)
    return res.status(400).send(`Webhook Error: ${err.message}`)
  }

  // Handle the checkout.session.completed event
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object
    // seller activation flow
    const userId = session.metadata && session.metadata.userId
    if (userId) {
      try {
        const uid = parseInt(userId, 10)
        const user = await prisma.user.findUnique({ where: { id: uid } })
        if (user && !user.isApprovedSeller) {
          await prisma.user.update({ where: { id: uid }, data: { isApprovedSeller: true } })

          try {
            await createNotification({ userId: uid, type: 'seller_status_change', actorId: null, content: 'Votre compte vendeur a été activé suite à votre paiement.' })
          } catch (e) {
            console.error('Failed to create notification', e)
          }

          try {
            await sendApprovalEmail(user.email, user.prenom || user.nomUtilisateur || '')
          } catch (e) {
            console.error('Error sending approval email', e)
          }
        }
      } catch (e) {
        console.error('Error processing checkout session', e)
      }
    }

    // sponsor purchase flow
    const sponsorPurchaseId = session.metadata && session.metadata.sponsorPurchaseId
    if (sponsorPurchaseId) {
      try {
        const pid = parseInt(sponsorPurchaseId, 10)
        const purchase = await prisma.sponsorPurchase.findUnique({ where: { id: pid } })
        if (purchase && purchase.status !== 'completed') {
          await prisma.sponsorPurchase.update({ where: { id: pid }, data: { status: 'completed' } })

          // create a Sponsor page for the purchaser if none exists
          let sponsor = await prisma.sponsor.findFirst({ where: { ownerEmail: purchase.userEmail } })
          if (!sponsor) {
            sponsor = await prisma.sponsor.create({ data: { title: `${purchase.userEmail} — Sponsor`, ownerEmail: purchase.userEmail, active: true } })
          }

          try {
            // create notification for the user
            // find user by email
            const user = await prisma.user.findUnique({ where: { email: purchase.userEmail } })
            if (user) {
              await createNotification({ userId: user.id, type: 'sponsor_purchase', actorId: null, content: 'Votre page sponsor a été activée après paiement.' })
            }
          } catch (e) {
            console.error('Failed to create sponsor notification', e)
          }
        }
      } catch (e) {
        console.error('Error processing sponsor purchase', e)
      }
    }
  }

  res.status(200).json({ received: true })
}
