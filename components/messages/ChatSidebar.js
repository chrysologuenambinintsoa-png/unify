import React, { useState, useEffect, useRef } from 'react'
import { useChat } from './ChatSystem'
import { useTranslation } from '../../hooks/useTranslation'
import styles from './ChatSystem.module.css'

export default function ChatSidebar({ user }) {
  const { t } = useTranslation()
  const { selectedConversation, setSelectedConversation, conversations, setConversations } = useChat()
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [isMinimized, setIsMinimized] = useState(false)
  const searchRef = useRef(null)

  useEffect(() => {
    fetchConversations()
  }, [user?.email])

  const fetchConversations = async () => {
    if (!user?.email) return

    try {
      setLoading(true)
      const res = await fetch(`/api/messages/conversations?userEmail=${encodeURIComponent(user.email)}`)
      if (res.ok) {
        const data = await res.json()
        setConversations(data.conversations || [])
      }
    } catch (error) {
      console.error('Failed to fetch conversations:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredConversations = conversations.filter(conv => {
    if (!searchQuery) return true
    const participants = JSON.parse(conv.participantNames || '[]')
    return participants.some(name => name.toLowerCase().includes(searchQuery.toLowerCase()))
  })

  const formatLastMessageTime = (dateString) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now - date
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return t('messages.justNow')
    if (diffMins < 60) return `${diffMins}m`
    if (diffHours < 24) return `${diffHours}h`
    if (diffDays === 1) return t('messages.yesterday')
    if (diffDays < 7) return `${diffDays}d`
    return date.toLocaleDateString()
  }

  return (
    <div
      className={styles.chatSidebar}
      style={{
        position: 'fixed',
        top: 0,
        right: isMinimized ? '-360px' : 0,
        width: '360px',
        height: '100vh',
        background: '#ffffff',
        borderLeft: '1px solid #e4e6ea',
        boxShadow: '-2px 0 8px rgba(0,0,0,0.1)',
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column',
        transition: 'right 0.3s ease',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '16px',
          borderBottom: '1px solid #e4e6ea',
          background: '#ffffff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={() => setIsMinimized(true)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '8px',
              borderRadius: '50%',
              color: '#65676b',
              fontSize: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s'
            }}
            onMouseEnter={e => e.currentTarget.style.background = '#f2f3f5'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            âœ•
          </button>
          <h2 style={{
            margin: 0,
            fontSize: '20px',
            fontWeight: '600',
            color: '#1c1e21'
          }}>
            {t('messages.title')}
          </h2>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Options button */}
          <button
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '8px',
              borderRadius: '50%',
              color: '#65676b',
              fontSize: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s'
            }}
            onMouseEnter={e => e.currentTarget.style.background = '#f2f3f5'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            â‹¯
          </button>
        </div>
      </div>

      {/* Search */}
      <div style={{ padding: '12px 16px', borderBottom: '1px solid #e4e6ea' }}>
        <div style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center'
        }}>
          <i
            className="fa fa-search"
            style={{
              position: 'absolute',
              left: '12px',
              color: '#65676b',
              fontSize: '14px',
              zIndex: 1
            }}
          />
          <input
            ref={searchRef}
            type="text"
            placeholder={t('messages.search')}
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 12px 8px 36px',
              border: '1px solid #e4e6ea',
              borderRadius: '20px',
              fontSize: '14px',
              background: '#f8f9fa',
              outline: 'none',
              transition: 'all 0.2s'
            }}
            onFocus={e => {
              e.target.style.borderColor = '#003d5c'
              e.target.style.background = '#ffffff'
            }}
            onBlur={e => {
              e.target.style.borderColor = '#e4e6ea'
              e.target.style.background = '#f8f9fa'
            }}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              style={{
                position: 'absolute',
                right: '12px',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: '#65676b',
                fontSize: '14px'
              }}
            >
              âœ•
            </button>
          )}
        </div>
      </div>

      {/* Conversations List */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          background: '#ffffff'
        }}
      >
        {loading ? (
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '200px'
          }}>
            <div style={{
              width: '32px',
              height: '32px',
              border: '3px solid #e4e6ea',
              borderTop: '3px solid #003d5c',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }} />
          </div>
        ) : filteredConversations.length === 0 ? (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '200px',
            color: '#65676b',
            textAlign: 'center',
            padding: '20px'
          }}>
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: '#f8f9fa',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '16px'
            }}>
              <i className="fa fa-comments" style={{
                fontSize: '24px',
                color: '#65676b',
                opacity: 0.5
              }} />
            </div>
            <h3 style={{
              margin: '0 0 8px 0',
              fontSize: '16px',
              fontWeight: '600',
              color: '#1c1e21'
            }}>
              {searchQuery ? 'No conversations found' : 'No conversations yet'}
            </h3>
            <p style={{
              margin: 0,
              fontSize: '14px',
              lineHeight: '1.4'
            }}>
              {searchQuery ? 'Try a different search term' : 'Start a conversation to connect with others'}
            </p>
          </div>
        ) : (
          filteredConversations.map((conversation, index) => {
            const participants = JSON.parse(conversation.participants || '[]')
            const participantNames = JSON.parse(conversation.participantNames || '[]')
            const otherParticipant = participants.find(p => p !== user.email)
            const otherName = participantNames[participants.indexOf(otherParticipant)] || t('messages.unknown')
            const hasUnread = conversation.unreadCount > 0
            const isSelected = selectedConversation?.id === conversation.id
            const isLast = index === filteredConversations.length - 1

            return (
              <div
                key={conversation.id}
                onClick={() => setSelectedConversation(conversation)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '12px 16px',
                  cursor: 'pointer',
                  borderBottom: isLast ? 'none' : '1px solid #f2f3f5',
                  background: isSelected
                    ? '#cce0f0'
                    : hasUnread
                      ? '#f8f9fa'
                      : '#ffffff',
                  transition: 'all 0.2s',
                  position: 'relative'
                }}
                onMouseEnter={e => {
                  if (!isSelected) {
                    e.currentTarget.style.background = hasUnread ? '#f2f3f5' : '#f8f9fa'
                  }
                }}
                onMouseLeave={e => {
                  if (!isSelected) {
                    e.currentTarget.style.background = hasUnread ? '#f8f9fa' : '#ffffff'
                  }
                }}
              >
                <div style={{ position: 'relative', marginRight: '12px' }}>
                  <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '50%',
                    background: conversation.avatar
                      ? `url(${conversation.avatar})`
                      : 'linear-gradient(135deg, #667eea, #764ba2)',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontWeight: '700',
                    fontSize: '18px',
                    flexShrink: 0,
                    border: hasUnread ? '2px solid #003d5c' : '2px solid #e4e6ea'
                  }}>
                    {!conversation.avatar && otherName[0]}
                  </div>

                  {/* Online status indicator */}
                  <div style={{
                    position: 'absolute',
                    bottom: '2px',
                    right: '2px',
                    width: '12px',
                    height: '12px',
                    borderRadius: '50%',
                    background: '#31a24c',
                    border: '2px solid #ffffff'
                  }} />
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '4px'
                  }}>
                    <span style={{
                      fontWeight: hasUnread ? '700' : '600',
                      color: hasUnread ? '#003d5c' : '#1c1e21',
                      fontSize: '15px',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}>
                      {otherName}
                    </span>
                    <span style={{
                      fontSize: '12px',
                      color: hasUnread ? '#003d5c' : '#65676b',
                      flexShrink: 0,
                      fontWeight: hasUnread ? '600' : '400'
                    }}>
                      {formatLastMessageTime(conversation.updatedAt)}
                    </span>
                  </div>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <span style={{
                      fontSize: '14px',
                      color: hasUnread ? '#1c1e21' : '#65676b',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      fontWeight: hasUnread ? '500' : '400'
                    }}>
                      {conversation.lastMessage || t('messages.noMessages')}
                    </span>
                    {hasUnread && (
                      <div style={{
                        background: '#003d5c',
                        color: 'white',
                        borderRadius: '10px',
                        minWidth: '20px',
                        height: '20px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '12px',
                        fontWeight: '700',
                        padding: '0 6px',
                        flexShrink: 0
                      }}>
                        {conversation.unreadCount > 99 ? '99+' : conversation.unreadCount}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
