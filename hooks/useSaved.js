import { useEffect, useState, useCallback } from 'react'

export default function useSaved(postId){
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    let mounted = true
    try{
      const arr = JSON.parse(localStorage.getItem('savedPosts') || '[]')
      if (mounted) setSaved(arr.includes(postId))
    }catch(e){ if (mounted) setSaved(false) }
    return () => { mounted = false }
  }, [postId])

  const syncServer = useCallback(async (isNowSaved) => {
    // If user logged in, try to sync with server
    try{
      const userStr = typeof window !== 'undefined' ? localStorage.getItem('user') : null
      const user = userStr ? JSON.parse(userStr) : null
      if (!user?.email) return
      const url = `/api/saved?userEmail=${encodeURIComponent(user.email)}`
      if (isNowSaved){
        await fetch(url, { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ postId }) })
      } else {
        await fetch(url, { method: 'DELETE', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ postId }) })
      }
    }catch(e){ console.error('syncServer error', e) }
  }, [postId])

  const toggle = useCallback(async () => {
    setLoading(true)
    try{
      // update localStorage
      const arr = JSON.parse(localStorage.getItem('savedPosts') || '[]')
      let updated
      if (arr.includes(postId)){
        updated = arr.filter(x => x !== postId)
        localStorage.setItem('savedPosts', JSON.stringify(updated))
        setSaved(false)
        await syncServer(false)
      } else {
        updated = [...new Set([...arr, postId])]
        localStorage.setItem('savedPosts', JSON.stringify(updated))
        setSaved(true)
        await syncServer(true)
      }
    }catch(e){
      console.error('toggleSaved error', e)
    }finally{
      setLoading(false)
    }
  }, [postId, syncServer])

  return { saved, loading, toggle }
}
