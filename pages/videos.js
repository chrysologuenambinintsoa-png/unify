import dynamic from 'next/dynamic'
import { useState } from 'react'
import Layout from '../components/Layout'
import Link from 'next/link'
import { PrismaClient } from '@prisma/client'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faFilm, faArrowLeft, faUser, faCalendarAlt, faComment, faHeart, faClapperboard, faPlay } from '@fortawesome/free-solid-svg-icons'

const UnifyVideoPlayer = dynamic(
  () => import('../components/components/video-player/VideoPlayer.js'),
  { ssr: false, loading: () => <div>Chargement du lecteur vidéo...</div> }
)

const prisma = new PrismaClient()

function guessVideoType(url) {
  if (!url) return 'video/mp4'
  const lowerUrl = url.toLowerCase()
  if (lowerUrl.endsWith('.webm')) return 'video/webm'
  if (lowerUrl.endsWith('.ogg') || lowerUrl.endsWith('.ogv')) return 'video/ogg'
  if (lowerUrl.endsWith('.mp4')) return 'video/mp4'
  return 'video/mp4'
}

export default function VideosPage({ videos }) {
  const [selectedVideo, setSelectedVideo] = useState(videos[0] || null)

  return (
    <Layout>
      <div style={{ padding: '24px', maxWidth: '1280px', margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap', marginBottom: '24px' }}>
          <div>
            <h1 style={{ fontSize: '32px', fontWeight: '700', margin: 0, display: 'flex', alignItems: 'center', gap: '12px' }}>
              <FontAwesomeIcon icon={faFilm} style={{ color: '#1877F2' }} />
              Vidéos
            </h1>
            <p style={{ margin: '8px 0 0', color: '#6b7280' }}>
              Sélectionnez une vidéo dans le menu pour la lire.
            </p>
          </div>
          <Link href="/" style={{ textDecoration: 'none' }}>
            <button style={{ background: '#1877F2', color: 'white', border: 'none', borderRadius: '10px', padding: '12px 20px', cursor: 'pointer', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FontAwesomeIcon icon={faArrowLeft} />
              Retour à l'accueil
            </button>
          </Link>
        </div>

        {!videos.length ? (
          <div style={{ background: '#ffffff', borderRadius: '16px', padding: '40px', textAlign: 'center', border: '1px solid #e5e7eb' }}>
            <h2 style={{ fontSize: '24px', marginBottom: '12px' }}>Aucune vidéo disponible</h2>
            <p style={{ color: '#6b7280' }}>
              Aucune vidéo n'a encore été publiée. Revenez bientôt.
            </p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '24px' }}>
            <aside style={{ borderRadius: '20px', border: '1px solid #e5e7eb', background: '#ffffff', padding: '16px', maxHeight: 'calc(100vh - 180px)', overflowY: 'auto' }}>
              <div style={{ marginBottom: '16px', fontWeight: 700, fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FontAwesomeIcon icon={faClapperboard} style={{ color: '#1877F2' }} />
                Menu Vidéos
              </div>
              {videos.map((video) => {
                const isActive = selectedVideo?.id === video.id
                return (
                  <button
                    key={video.id}
                    onClick={() => setSelectedVideo(video)}
                    style={{
                      width: '100%',
                      textAlign: 'left',
                      borderRadius: '14px',
                      border: isActive ? '2px solid #1877F2' : '1px solid #e5e7eb',
                      background: isActive ? '#eff6ff' : 'white',
                      padding: '14px',
                      marginBottom: '12px',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <div style={{ fontWeight: 600, marginBottom: '8px', color: '#111827', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <FontAwesomeIcon icon={faPlay} style={{ color: '#1877F2', fontSize: '12px' }} />
                      {video.title}
                    </div>
                    <div style={{ fontSize: '13px', color: '#6b7280' }}>{video.author?.email || 'Anonyme'}</div>
                    <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '6px' }}>{new Date(video.createdAt).toLocaleDateString('fr-FR')}</div>
                  </button>
                )
              })}
            </aside>

            <main style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {selectedVideo ? (
                <section style={{ background: 'white', borderRadius: '20px', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
                  <div style={{ padding: '24px' }}>
                    <h2 style={{ margin: 0, fontSize: '26px', lineHeight: '1.15' }}>{selectedVideo.title}</h2>
                    <p style={{ margin: '10px 0 0', color: '#6b7280' }}>{selectedVideo.description || 'Pas de description disponible.'}</p>
                  </div>
                  <div style={{ width: '100%', minHeight: '400px', background: '#000' }}>
                    <UnifyVideoPlayer
                      sources={[{ src: selectedVideo.url, type: guessVideoType(selectedVideo.url) }]}
                      poster={selectedVideo.thumbnail}
                      title={selectedVideo.title}
                      meta={selectedVideo.description || ''}
                      channel={selectedVideo.author?.email || 'Anonyme'}
                      views={`${selectedVideo._count?.likedBy || 0} likes`}
                      publishedAt={new Date(selectedVideo.createdAt).toLocaleDateString('fr-FR')}
                    />
                  </div>
                  <div style={{ padding: '24px', borderTop: '1px solid #e5e7eb', display: 'flex', flexWrap: 'wrap', gap: '24px' }}>
                    <span style={{ color: '#6b7280', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <FontAwesomeIcon icon={faUser} /> Auteur: {selectedVideo.author?.email || 'Anonyme'}
                    </span>
                    <span style={{ color: '#6b7280', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <FontAwesomeIcon icon={faComment} /> Commentaires: {selectedVideo._count?.comments || 0}
                    </span>
                    <span style={{ color: '#6b7280', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <FontAwesomeIcon icon={faHeart} /> Likes: {selectedVideo._count?.likedBy || 0}
                    </span>
                  </div>
                </section>
              ) : null}
            </main>
          </div>
        )}
      </div>
    </Layout>
  )
}

export async function getServerSideProps() {
  const videos = await prisma.video.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      author: {
        select: {
          id: true,
          email: true,
          avatarUrl: true,
        },
      },
      _count: {
        select: {
          comments: true,
          likedBy: true,
        },
      },
    },
  })

  return {
    props: {
      videos: JSON.parse(JSON.stringify(videos)),
    },
  }
}
