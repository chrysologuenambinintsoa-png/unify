import Stripe from 'stripe'
import { getUserFromToken } from '../../../lib/auth'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', { apiVersion: '2022-11-15' })

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST'])
    return res.status(405).end('Method Not Allowed')
  }

  const authHeader = req.headers.authorization || req.headers.Authorization
  if (!authHeader) return res.status(401).json({ error: 'Unauthorized' })
  const token = authHeader.replace(/^Bearer\s+/i, '')
  const user = await getUserFromToken(token)
  if (!user) return res.status(401).json({ error: 'Invalid token' })

  if (!process.env.STRIPE_SECRET_KEY) return res.status(500).json({ error: 'Stripe not configured' })

  const amount = parseInt(process.env.SELLER_FEE_AMOUNT || '4900', 10)
  const currency = process.env.SELLER_FEE_CURRENCY || 'eur'
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || `http://localhost:3000`

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency,
            product_data: { name: 'Activation compte vendeur Unify' },
            unit_amount: amount
          },
          quantity: 1
        }
      ],
      metadata: { userId: String(user.id) },
      success_url: `${baseUrl}/marketplace/upgrade-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/marketplace/upgrade-cancel`
    })

    return res.status(200).json({ url: session.url })
  } catch (e) {
    console.error('Stripe session creation error', e)
    return res.status(500).json({ error: 'Impossible de créer la session de paiement' })
  }
}
