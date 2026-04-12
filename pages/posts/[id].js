import Layout from '../../components/Layout'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'

export default function PostPage(){
  const router = useRouter()
  const { id } = router.query
  const [post, setPost] = useState(null)

  useEffect(()=>{
    if(!id) return
    fetch(`/api/posts/${id}`).then(r=>r.json()).then(d=>setPost(d.post)).catch(()=>{})
  },[id])

  if(!post) return (
    <Layout>
      <div className="card" style={{padding:20}}>Chargement...</div>
    </Layout>
  )

  return (
    <Layout>
      <div className="card" style={{padding:20}}>
        <h2 style={{marginBottom:8}}>{post.title}</h2>
        <div style={{color:'var(--fb-text-secondary)',marginBottom:12}}>{post.author} · {post.time}</div>
        <div style={{marginBottom:12}}>{post.content}</div>
        {post.image && <img src={post.image} alt="post" style={{width:'100%',borderRadius:8}} />}
      </div>
    </Layout>
  )
}