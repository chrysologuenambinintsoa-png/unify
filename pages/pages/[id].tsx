import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { UnifyPage } from '../../components/components/pages'

export default function PageDetail(){
  const router = useRouter()
  const { id } = router.query
  const [page, setPage] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState<any>(null)

  useEffect(()=>{
    if(!id) return
    fetchPage()
  },[id])

  useEffect(() => {
    try {
      const u = localStorage.getItem('user')
      if (u) setCurrentUser(JSON.parse(u))
    } catch (e) {}
  }, [])

  const fetchPage = async ()=>{
    try{
      setLoading(true)
      const res = await fetch(`/api/pages/${id}`)
      if(!res.ok) throw new Error('Failed to fetch page')
      const data = await res.json()
      setPage(data.page || data)
    }catch(e){
      console.error(e)
    }finally{ setLoading(false) }
  }

  if(loading) return <div className="p-6">Chargement...</div>
  if(!page) return <div className="p-6">Page introuvable</div>

  return (
    <div className="max-w-6xl mx-auto p-4">
      {/* @ts-expect-error - UnifyPage component is JS with no types */}
      <UnifyPage page={page} currentUser={currentUser} onPostCreate={fetchPage} />
    </div>
  )
}
