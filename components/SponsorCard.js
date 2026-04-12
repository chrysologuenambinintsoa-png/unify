import React from 'react';

// simple card to display a sponsor/ad
export default function SponsorCard({ sponsor }) {
  if (!sponsor) return null;
  const { title, content, link, image } = sponsor;
  return (
    <div
      className="card sponsored-card"
      style={{ cursor: link ? 'pointer' : 'default' }}
      onClick={() => {
        if (link) window.open(link, '_blank', 'noopener');
      }}
    >
      <div className="sponsored-title">Sponsorisé</div>
      <div className="ad-item">
        {sponsor.avatarUrl && (
          <div style={{marginRight:8}}>
            <img src={sponsor.avatarUrl} alt="avatar" style={{width:40,height:40,borderRadius:'50%'}} />
          </div>
        )}
        {image && (
          <div
            className="ad-image"
            style={{ backgroundImage: `url(${image})` }}
          />
        )}
        <div className="ad-info">
          <h4>{title}</h4>
          {content && <p className="ad-content">{content}</p>}
          {link && (
            <p className="ad-link">
              {link.replace(/^https?:\/\//, '')}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
