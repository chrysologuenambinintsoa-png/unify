import fs from 'fs'
import path from 'path'

const DATA = path.join(process.cwd(), 'data', 'evenements.json')

function readData() {
  try {
    const raw = fs.readFileSync(DATA, 'utf8')
    return JSON.parse(raw || '[]')
  } catch (e) {
    return []
  }
}

function writeData(arr) {
  fs.writeFileSync(DATA, JSON.stringify(arr, null, 2), 'utf8')
}

export default async function handler(req, res) {
  const { method } = req
  const { id } = req.query

  // Get group ID from the URL path
  const groupId = id

  try {
    switch (method) {
      case 'GET':
        // Return all events (or filter by groupId if needed)
        const allEvents = readData()
        
        // Optionally, we could filter events by group if events have a groupId field
        // For now, return all events as the global events system
        return res.status(200).json(allEvents)

      case 'POST':
        // Create a new event for this group
        const payload = req.body || {}
        const events = readData()
        
        const newEvent = {
          id: payload.id || `evt-${Date.now()}`,
          groupId: groupId,  // Associate event with this group
          title: payload.title || '',
          date: payload.date || '',
          location: payload.location || '',
          description: payload.description || '',
          image: payload.image || '',
          slug: payload.slug || payload.title?.toLowerCase().replace(/\s+/g, '-')
        }
        
        events.unshift(newEvent)
        
        try {
          writeData(events)
        } catch (e) {
          console.error('Error writing event:', e)
        }
        
        return res.status(201).json(newEvent)

      case 'DELETE':
        // Delete an event by ID
        const { eventId } = req.query
        if (!eventId) {
          return res.status(400).json({ error: 'eventId requis' })
        }
        
        const eventsList = readData()
        const eventIndex = eventsList.findIndex(e => e.id === eventId)
        
        if (eventIndex === -1) {
          return res.status(404).json({ error: 'Événement non trouvé' })
        }
        
        eventsList.splice(eventIndex, 1)
        
        try {
          writeData(eventsList)
        } catch (e) {
          console.error('Error deleting event:', e)
          return res.status(500).json({ error: 'Erreur lors de la suppression' })
        }
        
        return res.status(200).json({ message: 'Événement supprimé avec succès' })

      default:
        res.setHeader('Allow', ['GET', 'POST', 'DELETE'])
        return res.status(405).json({ error: `Méthode ${method} non autorisée` })
    }
  } catch (error) {
    console.error('Error in /api/groupes/[id]/events:', error)
    return res.status(500).json({ error: 'Erreur serveur' })
  }
}
