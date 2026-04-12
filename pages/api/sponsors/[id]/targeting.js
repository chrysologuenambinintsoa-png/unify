import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export default async function handler(req, res) {
  const { id } = req.query;
  const sponsorId = parseInt(id, 10);
  if (Number.isNaN(sponsorId)) {
    return res.status(400).json({ error: 'Invalid sponsor id' });
  }

  try {
    if (req.method === 'GET') {
      let targeting = await prisma.sponsorTarget.findUnique({
        where: { sponsorId }
      });
      if (!targeting) {
        targeting = await prisma.sponsorTarget.create({
          data: { sponsorId }
        });
      }
      // parse JSON arrays if present
      return res.status(200).json({
        ...targeting,
        countries: targeting.countries ? JSON.parse(targeting.countries) : [],
        cities: targeting.cities ? JSON.parse(targeting.cities) : [],
        interests: targeting.interests ? JSON.parse(targeting.interests) : [],
        devices: targeting.devices ? JSON.parse(targeting.devices) : []
      });
    }

    if (req.method === 'PUT') {
      const { minAge, maxAge, gender, countries, cities, interests, devices } = req.body;
      const targeting = await prisma.sponsorTarget.upsert({
        where: { sponsorId },
        update: {
          minAge,
          maxAge,
          gender,
          countries: countries ? JSON.stringify(countries) : null,
          cities: cities ? JSON.stringify(cities) : null,
          interests: interests ? JSON.stringify(interests) : null,
          devices: devices ? JSON.stringify(devices) : null
        },
        create: {
          sponsorId,
          minAge,
          maxAge,
          gender,
          countries: countries ? JSON.stringify(countries) : null,
          cities: cities ? JSON.stringify(cities) : null,
          interests: interests ? JSON.stringify(interests) : null,
          devices: devices ? JSON.stringify(devices) : null
        }
      });
      // parse JSON arrays before returning
      return res.status(200).json({
        ...targeting,
        countries: targeting.countries ? JSON.parse(targeting.countries) : [],
        cities: targeting.cities ? JSON.parse(targeting.cities) : [],
        interests: targeting.interests ? JSON.parse(targeting.interests) : [],
        devices: targeting.devices ? JSON.parse(targeting.devices) : []
      });
    }
  } catch (e) {
    console.error('sponsor targeting error', e);
    return res.status(500).json({ error: 'Internal server error' });
  }

  res.setHeader('Allow', ['GET', 'PUT']);
  res.status(405).end(`Method ${req.method} Not Allowed`);
}
