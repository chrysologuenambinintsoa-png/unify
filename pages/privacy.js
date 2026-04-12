import Link from 'next/link'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faShieldHalved, faArrowLeft } from '@fortawesome/free-solid-svg-icons'

export default function PrivacyPage() {
  return (
    <div style={{minHeight:'100vh',background:'#F8FAFC',padding:'40px 20px'}}>
      <div style={{maxWidth:800,margin:'0 auto'}}>
        <Link href="/welcome" style={{display:'inline-flex',alignItems:'center',gap:8,color:'#3B82F6',textDecoration:'none',fontWeight:500,marginBottom:32}}>
          <FontAwesomeIcon icon={faArrowLeft} />
          <span>Retour</span>
        </Link>
        
        <div style={{background:'white',borderRadius:20,padding:48,boxShadow:'0 4px 24px rgba(0,0,0,0.06)',border:'1px solid #E2E8F0'}}>
          <div style={{display:'flex',alignItems:'center',gap:16,marginBottom:32}}>
            <div style={{width:56,height:56,background:'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)',borderRadius:16,display:'flex',alignItems:'center',justifyContent:'center'}}>
              <FontAwesomeIcon icon={faShieldHalved} style={{fontSize:24,color:'white'}} />
            </div>
            <div>
              <h1 style={{fontSize:32,fontWeight:700,margin:0,color:'#0F172A'}}>Politique de confidentialité</h1>
              <p style={{fontSize:14,color:'#64748B',margin:0}}>Dernière mise à jour : Mars 2026</p>
            </div>
          </div>
          
          <div style={{lineHeight:1.8,color:'#334155'}}>
            <h2 style={{fontSize:20,fontWeight:700,color:'#0F172A',marginTop:32,marginBottom:16}}>1. Collecte des informations</h2>
            <p style={{marginBottom:16}}>
              Nous collectons les informations que vous nous fournissez directement, notamment lors de la création de votre compte, la modification de votre profil ou l'utilisation de nos services. Ces informations peuvent inclure votre nom, votre adresse e-mail, votre photo de profil et d'autres informations que vous choisissez de partager.
            </p>
            
            <h2 style={{fontSize:20,fontWeight:700,color:'#0F172A',marginTop:32,marginBottom:16}}>2. Utilisation des informations</h2>
            <p style={{marginBottom:16}}>
              Les informations que nous collectons sont utilisées pour fournir, maintenir et améliorer nos services, pour communiquer avec vous et pour personnaliser votre expérience. Nous utilisons également ces informations pour assurer la sécurité de notre plateforme et prévenir les abus.
            </p>
            
            <h2 style={{fontSize:20,fontWeight:700,color:'#0F172A',marginTop:32,marginBottom:16}}>3. Partage des informations</h2>
            <p style={{marginBottom:16}}>
              Nous ne vendons pas vos informations personnelles à des tiers. Nous pouvons partager vos informations dans les cas suivants : avec votre consentement, pour respecter nos obligations légales, ou pour protéger nos droits et notre sécurité.
            </p>
            
            <h2 style={{fontSize:20,fontWeight:700,color:'#0F172A',marginTop:32,marginBottom:16}}>4. Sécurité des données</h2>
            <p style={{marginBottom:16}}>
              Nous mettons en œuvre des mesures de sécurité techniques et organisationnelles pour protéger vos informations contre tout accès non autorisé, toute modification, divulgation ou destruction.
            </p>
            
            <h2 style={{fontSize:20,fontWeight:700,color:'#0F172A',marginTop:32,marginBottom:16}}>5. Vos droits</h2>
            <p style={{marginBottom:16}}>
              Vous avez le droit d'accéder à vos informations personnelles, de les corriger, de les supprimer ou de limiter leur traitement. Vous pouvez également vous opposer au traitement de vos données ou demander la portabilité de vos données.
            </p>
            
            <h2 style={{fontSize:20,fontWeight:700,color:'#0F172A',marginTop:32,marginBottom:16}}>6. Contact</h2>
            <p style={{marginBottom:16}}>
              Si vous avez des questions concernant cette politique de confidentialité, veuillez nous contacter à l'adresse : privacy@unify.com
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
