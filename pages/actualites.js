import Layout from '../components/Layout'
import Notifications from '../components/Notifications'

export default function ActualitesPage(){
  const [user, setUser] = useState(null)

  useEffect(() => {
    const u = localStorage.getItem('user')
    setUser(u ? JSON.parse(u) : null)
  }, [])

  return (
    <Layout>
      <Notifications user={user} />
    </Layout>
  )
}

import { useEffect, useState } from 'react'
