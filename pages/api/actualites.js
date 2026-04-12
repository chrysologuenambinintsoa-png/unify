// Mock data for news/actualites
const mockActualites = [
  { 
    id: 1, 
    title: 'React 19 annoncé avec de nouvelles features', 
    excerpt: 'La dernière version de React apporte des améliorations significatives de performance et de nouvelles hooks...',
    author: 'David Chen',
    source: 'Tech Blog',
    category: 'tech',
    time: 'il y a 2h',
    image: 'linear-gradient(135deg, #0B3D91, #764ba2)'
  },
  { 
    id: 2, 
    title: 'Les tendances du design UI/UX 2024',
    excerpt: 'Découvrez les principales tendances qui façonnent le design d\'interface en 2024...',
    author: 'Emma Design',
    source: 'Design Daily',
    category: 'design',
    time: 'il y a 4h',
    image: 'linear-gradient(135deg, #f093fb, #f5576c)'
  },
  { 
    id: 3, 
    title: 'Startup tech reçoit 50M $ de financement',
    excerpt: 'Une nouvelle startup innovante lève 50 millions de dollars pour accélérer sa croissance globale...',
    author: 'Marie Finance',
    source: 'Business News',
    category: 'business',
    time: 'il y a 6h',
    image: 'linear-gradient(135deg, #0B3D91, #082B60)'
  },
  { 
    id: 4, 
    title: 'Optimisation Web : 5 conseils essentiels',
    excerpt: 'Améliorez les performances de votre site web avec ces 5 meilleures pratiques...',
    author: 'Pierre Dev',
    source: 'Dev Tips',
    category: 'web',
    time: 'il y a 8h',
    image: 'linear-gradient(135deg, #43e97b, #38f9d7)'
  },
  { 
    id: 5, 
    title: 'IA générative : Impact sur l\'industrie tech',
    excerpt: 'Comment l\'intelligence artificielle transforme le paysage technologique actuel...',
    author: 'Sophie AI',
    source: 'Tech Insights',
    category: 'tech',
    time: 'il y a 10h',
    image: 'linear-gradient(135deg, #fa709a, #fee140)'
  },
  { 
    id: 6, 
    title: 'Nouveaux outils de prototypage rapide',
    excerpt: 'Découvrez les meilleurs outils pour créer rapidement des prototypes de vos idées...',
    author: 'Luc Design',
    source: 'Design Tools',
    category: 'design',
    time: 'il y a 12h',
    image: 'linear-gradient(135deg, #667eea, #764ba2)'
  },
  { 
    id: 7, 
    title: 'Cryptomonnaies : Régulations 2024',
    excerpt: 'Les nouvelles régulations qui encadreront les cryptomonnaies cette année...',
    author: 'Alice Finance',
    source: 'Finance Today',
    category: 'business',
    time: 'il y a 14h',
    image: 'linear-gradient(135deg, #f093fb, #f5576c)'
  },
  { 
    id: 8, 
    title: 'TypeScript 5.2 : Nouvelles améliorations',
    excerpt: 'Les dernières additions à TypeScript augmentent la sécurité des types...',
    author: 'Thomas Dev',
    source: 'Dev News',
    category: 'web',
    time: 'il y a 1j',
    image: 'linear-gradient(135deg, #43e97b, #38f9d7)'
  },
]

export default function handler(req, res) {
  if (req.method === 'GET') {
    return res.status(200).json({ actualites: mockActualites })
  }
  
  return res.status(405).json({ error: 'Method not allowed' })
}
