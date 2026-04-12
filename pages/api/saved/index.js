import fs from 'fs'
import path from 'path'

const DATA_PATH = path.join(process.cwd(), 'data', 'saved.json')

function readData(){
  try{
    const raw = fs.readFileSync(DATA_PATH, 'utf8')
    return JSON.parse(raw || '{}')
  }catch(e){
    return {}
  }
}

function writeData(obj){
  try{
    fs.mkdirSync(path.dirname(DATA_PATH), { recursive: true })
    fs.writeFileSync(DATA_PATH, JSON.stringify(obj, null, 2), 'utf8')
    return true
  }catch(e){
    console.error('writeData error', e)
    return false
  }
}

export default function handler(req, res){
  const { method } = req
  const { userEmail } = req.query

  if (!userEmail) {
    // require userEmail for server-side saved lists
    if (method === 'GET') return res.status(200).json({ saved: [] })
    return res.status(400).json({ error: 'userEmail query required' })
  }

  const data = readData()
  const list = Array.isArray(data[userEmail]) ? data[userEmail] : []

  if (method === 'GET'){
    return res.status(200).json({ saved: list })
  }

  if (method === 'POST'){
    const { postId } = req.body || {}
    if (!postId) return res.status(400).json({ error: 'postId required' })
    const updated = Array.from(new Set([...(list||[]), postId]))
    data[userEmail] = updated
    if (writeData(data)) return res.status(200).json({ saved: updated })
    return res.status(500).json({ error: 'write failed' })
  }

  if (method === 'DELETE'){
    const { postId } = req.body || {}
    if (!postId) return res.status(400).json({ error: 'postId required' })
    const updated = (list || []).filter(id => String(id) !== String(postId))
    data[userEmail] = updated
    if (writeData(data)) return res.status(200).json({ saved: updated })
    return res.status(500).json({ error: 'write failed' })
  }

  res.setHeader('Allow', 'GET,POST,DELETE')
  res.status(405).end(`Method ${method} Not Allowed`)
}
