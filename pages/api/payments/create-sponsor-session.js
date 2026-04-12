import Stripe from 'stripe'
import jwt from 'jsonwebtoken'
import { verifyToken } from '../../../lib/auth'
import prisma from '../../../lib/prisma'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', { apiVersion: '2022-11-15' })
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret'

async function getUser(req) {
  // First check x-user-email header (used by frontend)
  const headerEmail = req.headers['x-user-email'];
  if (headerEmail) {
    const user = await prisma.user.findUnique({ where: { email: headerEmail } });
    if (user) return user;
  }

  // Try JWT from Authorization header
  const authHeader = req.headers.authorization
  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      const token = authHeader.split(' ')[1]
      const decoded = jwt.verify(token, JWT_SECRET)
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId || decoded.sub }
      })
      if (user) return user
    } catch (err) {
      console.log('JWT verification failed:', err.message)
    }
  }
  
  // Fallback to query param for testing
  const userEmail = req.query.userEmail
  if (userEmail) {
    const user = await prisma.user.findUnique({ where: { email: userEmail } })
    if (user) return user
  }
  
  return null
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST'])
    return res.status(405).end('Method Not Allowed')
  }

  const user = await getUser(req)
  if (!user) return res.status(401).json({ error: 'Non autorisé. Token ou userEmail requis.' })

  if (!process.env.STRIPE_SECRET_KEY) return res.status(500).json({ error: 'Stripe not configured' })

  const amount = parseInt(process.env.SPONSOR_FEE_AMOUNT || '9900', 10)
  const currency = process.env.SPONSOR_FEE_CURRENCY || 'eur'
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || `http://localhost:3000`

  try {
    // create a SponsorPurchase record pending
    const purchase = await prisma.sponsorPurchase.create({ data: {
      userEmail: user.email,
      amount: amount / 100.0,
      currency: currency.toUpperCase(),
      status: 'pending'
    } })

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency,
            product_data: { name: 'Activation Sponsor Unify' },
            unit_amount: amount
          },
          quantity: 1
        }
      ],
      metadata: { sponsorPurchaseId: String(purchase.id) },
      success_url: `${baseUrl}/sponsor/upgrade-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/sponsor/upgrade-cancel`
    })

    return res.status(200).json({ url: session.url })
  } catch (e) {
    console.error('Sponsor Stripe session creation error', e)
    return res.status(500).json({ error: 'Impossible de créer la session sponsor' })
  }
}
