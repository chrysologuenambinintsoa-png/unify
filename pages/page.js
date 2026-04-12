import Layout from '../components/Layout'
import { UnifyPage } from '../components/components/pages'
import PostCard from '../components/PostCard'
import CreatePost from '../components/CreatePost'
import CreatePostModal from '../components/CreatePostModal'

export default function PagePage(){
  return (
    <Layout leftSidebar={false} rightSidebar={false}>
      <CreatePostModal />
      <UnifyPage />
    </Layout>
  )
}