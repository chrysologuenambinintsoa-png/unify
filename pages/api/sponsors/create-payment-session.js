import { PrismaClient } from '@prisma/client';
import Stripe from 'stripe';

const prisma = new PrismaClient();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { sponsorId, userEmail } = req.body;

    if (!sponsorId || !userEmail) {
      return res.status(400).json({ error: 'sponsorId and userEmail are required' });
    }

    // Vérifier que le sponsor existe et n'a pas encore payé
    const sponsor = await prisma.sponsor.findUnique({
      where: { id: parseInt(sponsorId) }
    });

    if (!sponsor) {
      return res.status(404).json({ error: 'Sponsor not found' });
    }

    if (sponsor.platformFeePaid) {
      return res.status(400).json({ error: 'Platform fee already paid' });
    }

    // Créer une session de paiement Stripe
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: 'Frais de plateforme Unify - Activation annonce',
              description: `Activation de l'annonce "${sponsor.title}"`,
            },
            unit_amount: 5000, // 50€ en centimes
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/become-sponsor?success=true&sponsorId=${sponsorId}`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/become-sponsor?canceled=true&sponsorId=${sponsorId}`,
      metadata: {
        sponsorId: sponsorId.toString(),
        userEmail,
        type: 'platform_fee'
      },
    });

    return res.status(200).json({ sessionId: session.id, url: session.url });
  } catch (error) {
    console.error('Stripe session creation error:', error);
    return res.status(500).json({ error: 'Failed to create payment session' });
  }
}