import Link from 'next/link'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faHeadset, faArrowLeft, faEnvelope, faQuestionCircle, faBug, faLightbulb } from '@fortawesome/free-solid-svg-icons'

export default function SupportPage() {
  const router = useRouter()
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    const userStr = localStorage.getItem('user')
    setIsAuthenticated(!!userStr)
  }, [])

  const handleBack = () => {
    if (isAuthenticated) {
      router.push('/feed')
    } else {
      router.push('/welcome')
    }
  }

  return (
    <div style={{minHeight:'100vh',background:'#F8FAFC',padding:'40px 20px'}}>
      <div style={{maxWidth:800,margin:'0 auto'}}>
        <button onClick={handleBack} style={{display:'inline-flex',alignItems:'center',gap:8,color:'#3B82F6',textDecoration:'none',fontWeight:500,marginBottom:32,background:'none',border:'none',cursor:'pointer',fontSize:16}}>
          <FontAwesomeIcon icon={faArrowLeft} />
          <span>Retour</span>
        </button>
        
        <div style={{background:'white',borderRadius:20,padding:48,boxShadow:'0 4px 24px rgba(0,0,0,0.06)',border:'1px solid #E2E8F0'}}>
          <div style={{display:'flex',alignItems:'center',gap:16,marginBottom:32}}>
            <div style={{width:56,height:56,background:'linear-gradient(135deg, #10B981 0%, #059669 100%)',borderRadius:16,display:'flex',alignItems:'center',justifyContent:'center'}}>
              <FontAwesomeIcon icon={faHeadset} style={{fontSize:24,color:'white'}} />
            </div>
            <div>
              <h1 style={{fontSize:32,fontWeight:700,margin:0,color:'#0F172A'}}>Support</h1>
              <p style={{fontSize:14,color:'#64748B',margin:0}}>Nous sommes là pour vous aider</p>
            </div>
          </div>
          
          <div style={{lineHeight:1.8,color:'#334155'}}>
            <p style={{marginBottom:32,fontSize:16}}>
              Notre équipe de support est disponible pour vous aider avec toutes vos questions ou préoccupations. Choisissez l'option qui correspond le mieux à votre besoin.
            </p>
            
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:20,marginBottom:32}}>
              <div style={{background:'#F8FAFC',borderRadius:16,padding:24,border:'1px solid #E2E8F0'}}>
                <div style={{width:48,height:48,background:'#EFF6FF',borderRadius:12,display:'flex',alignItems:'center',justifyContent:'center',marginBottom:16}}>
                  <FontAwesomeIcon icon={faQuestionCircle} style={{fontSize:20,color:'#3B82F6'}} />
                </div>
                <h3 style={{fontSize:18,fontWeight:700,color:'#0F172A',margin:'0 0 8px 0'}}>Questions fréquentes</h3>
                <p style={{fontSize:14,color:'#64748B',margin:0}}>Consultez notre FAQ pour trouver des réponses rapides à vos questions.</p>
              </div>
              
              <div style={{background:'#F8FAFC',borderRadius:16,padding:24,border:'1px solid #E2E8F0'}}>
                <div style={{width:48,height:48,background:'#FEF3C7',borderRadius:12,display:'flex',alignItems:'center',justifyContent:'center',marginBottom:16}}>
                  <FontAwesomeIcon icon={faBug} style={{fontSize:20,color:'#F59E0B'}} />
                </div>
                <h3 style={{fontSize:18,fontWeight:700,color:'#0F172A',margin:'0 0 8px 0'}}>Signaler un bug</h3>
                <p style={{fontSize:14,color:'#64748B',margin:0}}>Vous avez trouvé un problème ? Aidez-nous à l'améliorer en le signalant.</p>
              </div>
              
              <div style={{background:'#F8FAFC',borderRadius:16,padding:24,border:'1px solid #E2E8F0'}}>
                <div style={{width:48,height:48,background:'#ECFDF5',borderRadius:12,display:'flex',alignItems:'center',justifyContent:'center',marginBottom:16}}>
                  <FontAwesomeIcon icon={faLightbulb} style={{fontSize:20,color:'#10B981'}} />
                </div>
                <h3 style={{fontSize:18,fontWeight:700,color:'#0F172A',margin:'0 0 8px 0'}}>Suggestion</h3>
                <p style={{fontSize:14,color:'#64748B',margin:0}}>Vous avez une idée pour améliorer Unify ? Partagez-la avec nous.</p>
              </div>
              
              <div style={{background:'#F8FAFC',borderRadius:16,padding:24,border:'1px solid #E2E8F0'}}>
                <div style={{width:48,height:48,background:'#F5F3FF',borderRadius:12,display:'flex',alignItems:'center',justifyContent:'center',marginBottom:16}}>
                  <FontAwesomeIcon icon={faEnvelope} style={{fontSize:20,color:'#8B5CF6'}} />
                </div>
                <h3 style={{fontSize:18,fontWeight:700,color:'#0F172A',margin:'0 0 8px 0'}}>Contactez-nous</h3>
                <p style={{fontSize:14,color:'#64748B',margin:0}}>Envoyez-nous un message directement pour toute question.</p>
              </div>
            </div>
            
            <div style={{background:'linear-gradient(135deg, #0F172A 0%, #1E40AF 100%)',borderRadius:16,padding:32,color:'white',textAlign:'center'}}>
              <h2 style={{fontSize:24,fontWeight:700,margin:'0 0 12px 0'}}>Besoin d'aide ?</h2>
              <p style={{fontSize:16,opacity:0.9,margin:'0 0 24px 0'}}>Notre équipe est disponible du lundi au vendredi, de 9h à 18h.</p>
              <a href="mailto:support@unify.com" style={{display:'inline-flex',alignItems:'center',gap:8,background:'white',color:'#0F172A',padding:'12px 24px',borderRadius:8,textDecoration:'none',fontWeight:600,transition:'all 0.3s ease'}}>
                <FontAwesomeIcon icon={faEnvelope} />
                <span>support@unify.com</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
