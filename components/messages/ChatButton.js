import React from 'react'
import { useChat } from './ChatSystem'

export default function ChatButton() {
  const { isChatOpen, setIsChatOpen, conversations } = useChat()

  const unreadCount = conversations.reduce((total, conv) => total + (conv.unreadCount || 0), 0)

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        zIndex: 999
      }}
    >
      {/* Chat button */}
      <button
        onClick={() => setIsChatOpen(!isChatOpen)}
        style={{
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          background: '#003d5c',
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontSize: '24px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          transition: 'all 0.3s ease',
          position: 'relative'
        }}
        onMouseEnter={e => {
          e.currentTarget.style.transform = 'scale(1.05)'
          e.currentTarget.style.boxShadow = '0 6px 16px rgba(0,0,0,0.2)'
        }}
        onMouseLeave={e => {
          e.currentTarget.style.transform = 'scale(1)'
          e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)'
        }}
      >
        {isChatOpen ? (
          <i className="fa fa-times"></i>
        ) : (
          <i className="fa fa-comments"></i>
        )}

        {/* Unread badge */}
        {unreadCount > 0 && !isChatOpen && (
          <div
            style={{
              position: 'absolute',
              top: '-8px',
              right: '-8px',
              background: '#fa383e',
              color: 'white',
              borderRadius: '12px',
              minWidth: '24px',
              height: '24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '12px',
              fontWeight: '700',
              padding: '0 6px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
            }}
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </div>
        )}
      </button>
    </div>
  )
}
