import Layout from '../components/Layout'
import EvenementList from '../components/Evenement'

export default function Evenements(){
  return (
    <Layout>
      <div style={{maxWidth:1100,margin:'0 auto',padding:16}}>
        <EvenementList />
      </div>
    </Layout>
  )
}
