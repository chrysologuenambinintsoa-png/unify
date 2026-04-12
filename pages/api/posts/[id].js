const mockPosts = [
  { id: '1', title: 'Mon premier post', author: 'Jean Dupont', time: 'il y a 2h', content: 'Voici le contenu du post 1.', image: '' },
  { id: '2', title: 'Annonce importante', author: 'Marie Dupont', time: 'il y a 1j', content: 'Détails de l annonce 2.', image: '' },
  { id: '3', title: 'Astuce dev', author: 'Pierre Martin', time: 'il y a 3j', content: 'Quelques conseils de dev.', image: '' },
]

export default function handler(req, res){
  const { id } = req.query
  const post = mockPosts.find(p => p.id === id)
  if(!post) return res.status(404).json({ error: 'Not found' })
  return res.status(200).json({ post })
}