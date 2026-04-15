import React, { useEffect, useState } from 'react';
import Modal from './Modal';
import PropTypes from 'prop-types';

export default function InviteModal({ currentUser, pageName, onClose, open = true }) {

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [friends, setFriends] = useState([]);
  const [inviteLoading, setInviteLoading] = useState(null); // id de l'ami en cours d'invitation
  const [invited, setInvited] = useState({});

  // Charger les amis automatiquement
  useEffect(() => {
    async function fetchFriends() {
      if (!currentUser?.email) return;
      setLoading(true);
      try {
        const res = await fetch(`/api/amis?userEmail=${encodeURIComponent(currentUser.email)}`);
        const data = await res.json();
        setFriends(data.amis || []);
      } catch (e) {
        setError("Erreur lors du chargement des amis");
      } finally {
        setLoading(false);
      }
    }
    fetchFriends();
  }, [currentUser?.email]);

  // Inviter un ami par son id
  const handleInvite = async (friend) => {
    setInviteLoading(friend.id);
    setError("");
    setSuccess(false);
    try {
      const res = await fetch("/api/pages/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ friendId: friend.id, pageName }),
      });
      if (!res.ok) throw new Error("Erreur lors de l'invitation");
      setInvited((prev) => ({ ...prev, [friend.id]: true }));
      setSuccess(true);
    } catch (err) {
      setError(err.message || "Erreur inconnue");
    } finally {
      setInviteLoading(null);
    }
  };


  return (
    <Modal onClose={onClose} open={open} title={`Inviter des membres à ${pageName}`}>
      <div className="up-invite-modal" style={{background:'none',boxShadow:'none',borderRadius:0,padding:0}}>
        <p className="up-invite-desc">
          Invitez vos amis à rejoindre la page <b>{pageName}</b>.
        </p>
        {loading ? (
          <div className="up-invite-hint">Chargement des amis...</div>
        ) : (
          <div className="up-invite-friends-list" style={{padding:'0 20px 20px 20px', maxHeight: '320px', overflowY: 'auto'}}>
            {friends.length === 0 && <div className="up-invite-hint">Aucun ami à inviter.</div>}
            {friends.map(friend => (
              <div key={friend.id} className="up-invite-friend-item" style={{display:'flex',alignItems:'center',gap:12,padding:'10px 0',borderBottom:'1px solid var(--up-border-light)'}}>
                <img src={friend.avatarUrl || ''} alt={friend.name} className="up-invite-friend-avatar" style={{width:40,height:40,borderRadius:'50%',objectFit:'cover',background:'#f3f4f6',marginRight:12,boxShadow:'0 1px 4px rgba(0,0,0,0.04)'}} />
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontWeight:600,fontSize:15,color:'var(--up-text-primary)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{friend.name}</div>
                  <div style={{fontSize:13,color:'var(--up-text-secondary)'}}>@{friend.nomUtilisateur}</div>
                </div>
                <button
                  className="up-invite-send-btn"
                  style={{width:110,maxWidth:'100%',padding:'8px 0'}} 
                  disabled={inviteLoading === friend.id || invited[friend.id]}
                  onClick={() => handleInvite(friend)}
                >
                  {invited[friend.id] ? 'Invité !' : (inviteLoading === friend.id ? 'Envoi...' : 'Inviter')}
                </button>
              </div>
            ))}
          </div>
        )}
        {success && <div className="up-invite-success">Invitation envoyée !</div>}
        {error && <div className="up-invite-error">{error}</div>}
      </div>
    </Modal>
  );
}

InviteModal.propTypes = {
  currentUser: PropTypes.object,
  pageName: PropTypes.string.isRequired,
  onClose: PropTypes.func.isRequired,
};
