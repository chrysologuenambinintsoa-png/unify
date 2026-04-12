import Link from 'next/link'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faFileContract, faArrowLeft } from '@fortawesome/free-solid-svg-icons'

export default function TermsPage() {
  return (
    <div style={{minHeight:'100vh',background:'#F8FAFC',padding:'40px 20px'}}>
      <div style={{maxWidth:800,margin:'0 auto'}}>
        <Link href="/welcome" style={{display:'inline-flex',alignItems:'center',gap:8,color:'#3B82F6',textDecoration:'none',fontWeight:500,marginBottom:32}}>
          <FontAwesomeIcon icon={faArrowLeft} />
          <span>Retour</span>
        </Link>
        
        <div style={{background:'white',borderRadius:20,padding:48,boxShadow:'0 4px 24px rgba(0,0,0,0.06)',border:'1px solid #E2E8F0'}}>
          <div style={{display:'flex',alignItems:'center',gap:16,marginBottom:32}}>
            <div style={{width:56,height:56,background:'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',borderRadius:16,display:'flex',alignItems:'center',justifyContent:'center'}}>
              <FontAwesomeIcon icon={faFileContract} style={{fontSize:24,color:'white'}} />
            </div>
            <div>
              <h1 style={{fontSize:32,fontWeight:700,margin:0,color:'#0F172A'}}>Conditions d'utilisation</h1>
              <p style={{fontSize:14,color:'#64748B',margin:0}}>Dernière mise à jour : Mars 2026</p>
            </div>
          </div>
          
          <div style={{lineHeight:1.8,color:'#334155'}}>
            <h2 style={{fontSize:20,fontWeight:700,color:'#0F172A',marginTop:32,marginBottom:16}}>1. Acceptation des conditions</h2>
            <p style={{marginBottom:16}}>
              En accédant et en utilisant Unify, vous acceptez d'être lié par ces conditions d'utilisation. Si vous n'acceptez pas ces conditions, veuillez ne pas utiliser notre service.
            </p>
            
            <h2 style={{fontSize:20,fontWeight:700,color:'#0F172A',marginTop:32,marginBottom:16}}>2. Description du service</h2>
            <p style={{marginBottom:16}}>
              Unify est une plateforme sociale qui permet aux utilisateurs de se connecter, de partager du contenu et d'interagir avec d'autres utilisateurs. Nous nous réservons le droit de modifier, suspendre ou interrompre le service à tout moment.
            </p>
            
            <h2 style={{fontSize:20,fontWeight:700,color:'#0F172A',marginTop:32,marginBottom:16}}>3. Comptes utilisateurs</h2>
            <p style={{marginBottom:16}}>
              Vous êtes responsable de maintenir la confidentialité de votre compte et de votre mot de passe. Vous acceptez de nous informer immédiatement de toute utilisation non autorisée de votre compte.
            </p>
            
            <h2 style={{fontSize:20,fontWeight:700,color:'#0F172A',marginTop:32,marginBottom:16}}>4. Contenu utilisateur</h2>
            <p style={{marginBottom:16}}>
              Vous conservez tous les droits sur le contenu que vous publiez sur Unify. En publiant du contenu, vous nous accordez une licence mondiale, non exclusive et gratuite pour utiliser, reproduire et distribuer ce contenu dans le cadre de notre service.
            </p>
            
            <h2 style={{fontSize:20,fontWeight:700,color:'#0F172A',marginTop:32,marginBottom:16}}>5. Conduite de l'utilisateur</h2>
            <p style={{marginBottom:16}}>
              Vous acceptez de ne pas utiliser le service pour : harceler, menacer ou intimider d'autres utilisateurs ; publier du contenu illégal, obscène ou diffamatoire ; ou violer les droits de propriété intellectuelle d'autrui.
            </p>
            
            <h2 style={{fontSize:20,fontWeight:700,color:'#0F172A',marginTop:32,marginBottom:16}}>6. Limitation de responsabilité</h2>
            <p style={{marginBottom:16}}>
              Unify ne sera pas responsable des dommages indirects, accessoires, spéciaux ou consécutifs résultant de votre utilisation du service. Notre responsabilité totale est limitée au montant que vous avez payé pour utiliser le service.
            </p>
            
            <h2 style={{fontSize:20,fontWeight:700,color:'#0F172A',marginTop:32,marginBottom:16}}>7. Modifications des conditions</h2>
            <p style={{marginBottom:16}}>
              Nous nous réservons le droit de modifier ces conditions à tout moment. Les modifications prendront effet dès leur publication sur cette page. Votre utilisation continue du service après toute modification constitue votre acceptation des nouvelles conditions.
            </p>
            
            <h2 style={{fontSize:20,fontWeight:700,color:'#0F172A',marginTop:32,marginBottom:16}}>8. Contact</h2>
            <p style={{marginBottom:16}}>
              Si vous avez des questions concernant ces conditions d'utilisation, veuillez nous contacter à l'adresse : legal@unify.com
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
