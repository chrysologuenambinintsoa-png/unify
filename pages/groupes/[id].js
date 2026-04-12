import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Layout from '../../components/Layout';
import { UnifyGroup } from '../../components/components/group';

export default function GroupeDetail() {
  const router = useRouter();
  const { id } = router.query;
  const [groupe, setGroupe] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        setCurrentUser(JSON.parse(storedUser));
      } catch (e) {
        console.error('Error parsing user:', e);
      }
    }

    const safeId = encodeURIComponent(id);
    setLoading(true);
    Promise.all([
      fetch(`/api/groupes?groupId=${safeId}`).then(res => res.json()),
      fetch(`/api/groupes/${safeId}/members`).then(res => res.json()),
      fetch(`/api/groupes/${safeId}/posts`).then(res => res.json())
    ])
      .then(([groupData, membersData, postsData]) => {
        setGroupe(groupData.groupe || null);
        setMembers(membersData.members || []);
        setLocalPosts(postsData.posts || []);
      })
      .finally(() => setLoading(false));
  }, [id]);

  const [localPosts, setLocalPosts] = useState([]);

  const handleJoin = async () => {
    if (!currentUser) {
      router.push('/auth');
      return;
    }
    try {
      const safeId = encodeURIComponent(id);
      await fetch(`/api/groupes?action=join&groupId=${safeId}&userEmail=${encodeURIComponent(currentUser.email)}`, {
        method: 'PUT'
      });
      setGroupe(prev => prev ? { ...prev, isMember: true, membersCount: prev.membersCount + 1 } : null);
    } catch (e) {
      console.error('Error joining group:', e);
    }
  };

  const handleLeave = async () => {
    if (!currentUser) return;
    try {
      const safeId = encodeURIComponent(id);
      await fetch(`/api/groupes?action=leave&groupId=${safeId}&userEmail=${encodeURIComponent(currentUser.email)}`, {
        method: 'PUT'
      });
      setGroupe(prev => prev ? { ...prev, isMember: false, membersCount: prev.membersCount - 1 } : null);
    } catch (e) {
      console.error('Error leaving group:', e);
    }
  };

  const handlePostCreate = async (post) => {
    if (!currentUser) return;
    try {
      const safeId = encodeURIComponent(id);
      const res = await fetch(`/api/groupes/${safeId}/posts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: post.content,
          author: currentUser.email
        })
      });
      const data = await res.json();
      if (data.post) {
        setLocalPosts(prev => [data.post, ...prev]);
      }
    } catch (e) {
      console.error('Error creating post:', e);
    }
  };

  const handlePostReaction = async (postId, emoji) => {
    if (!currentUser) return;
    try {
      const safeId = encodeURIComponent(id);
      await fetch(`/api/groupes/${safeId}/posts/${postId}/reactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userEmail: currentUser.email,
          emoji
        })
      });
    } catch (e) {
      console.error('Error reacting to post:', e);
    }
  };

  const handlePostComment = async (postId, text) => {
    if (!currentUser) return;
    try {
      const safeId = encodeURIComponent(id);
      const res = await fetch(`/api/groupes/${safeId}/posts/${postId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          author: currentUser.email
        })
      });
      const data = await res.json();
      if (data.comment) {
        setLocalPosts(prev => prev.map(p => {
          if (p.id === postId) {
            return { ...p, comments: [...(p.comments || []), data.comment] };
          }
          return p;
        }));
      }
    } catch (e) {
      console.error('Error commenting:', e);
    }
  };

  if (loading) return (
    <Layout leftSidebar={true} rightSidebar={false}>
      <div style={{ maxWidth: 900, margin: '0 auto', padding: 16, textAlign: 'center' }}>
        <p style={{ color: '#666' }}>Chargement...</p>
      </div>
    </Layout>
  );
  
  if (!groupe) return (
    <Layout leftSidebar={true} rightSidebar={false}>
      <div style={{ maxWidth: 900, margin: '0 auto', padding: 16, textAlign: 'center' }}>
        <p style={{ color: '#666' }}>Groupe introuvable.</p>
        <button 
          onClick={() => router.push('/groupes')}
          style={{ marginTop: 16, padding: '10px 20px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer' }}
        >
          Retour aux groupes
        </button>
      </div>
    </Layout>
  );

  const isAdmin = currentUser && groupe.membersList && groupe.membersList.includes(currentUser.email);

  return (
    <Layout leftSidebar={true} rightSidebar={false}>
      <div style={{ maxWidth: 900, margin: '0 auto', padding: 16 }}>
        <button 
          onClick={() => router.push('/groupes')}
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 8, 
            background: 'none', 
            border: 'none', 
            color: '#2563eb', 
            fontSize: 14, 
            cursor: 'pointer',
            marginBottom: 16
          }}
        >
          ← Retour aux groupes
        </button>
        <UnifyGroup 
          group={{
            ...groupe,
            membersCount: groupe.members,
            isMember: groupe.joined || false
          }}
          currentUser={isAdmin ? { ...currentUser, role: 'admin' } : currentUser}
          members={members}
          posts={localPosts}
          onJoin={handleJoin}
          onLeave={handleLeave}
          onPostCreate={handlePostCreate}
          onPostReaction={handlePostReaction}
          onPostComment={handlePostComment}
        />
      </div>
    </Layout>
  );
}