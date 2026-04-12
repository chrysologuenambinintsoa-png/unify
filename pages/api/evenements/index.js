import fs from 'fs'
import path from 'path'

const DATA = path.join(process.cwd(), 'data', 'evenements.json')

function readData(){
  try{
    const raw = fs.readFileSync(DATA,'utf8')
    return JSON.parse(raw || '[]')
  }catch(e){ return [] }
}

function writeData(arr){
  fs.writeFileSync(DATA, JSON.stringify(arr, null, 2), 'utf8')
}

export default function handler(req, res){
  if(req.method === 'GET'){
    const data = readData()
    return res.status(200).json(data)
  }

  if(req.method === 'POST'){
    const payload = req.body || {}
    const events = readData()
    const id = payload.id || String(Date.now())
    const ev = { id, ...payload }
    events.unshift(ev)
    try{ writeData(events) }catch(e){ console.error(e) }
    return res.status(201).json(ev)
  }

  if(req.method === 'DELETE'){
    const { id } = req.query
    if(!id) return res.status(400).json({ error:'id required' })
    const events = readData().filter(e=>String(e.id) !== String(id))
    try{ writeData(events) }catch(e){ console.error(e) }
    return res.status(200).json({ ok:true })
  }

  res.setHeader('Allow','GET,POST,DELETE')
  res.status(405).end()`Method ${req.method} Not Allowed`
}
