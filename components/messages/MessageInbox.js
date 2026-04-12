import React, { useState, useEffect, useRef } from 'react'
import Modal from '../Modal'
import MessageThread from './MessageThread'
import { useTranslation } from '../../hooks/useTranslation'

export default function MessageInbox({ user, onClose }) {
  const { t } = useTranslation()
  const [conversations, setConversations] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedConversation, setSelectedConversation] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [isMobile, setIsMobile] = useState(false)
  const searchRef = useRef(null)

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768)
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

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

  const handleConversationSelect = (conversation) => {
    setSelectedConversation(conversation)
  }

  const handleBackToInbox = () => {
    setSelectedConversation(null)
  }

  const handleCloseChat = () => {
    setSelectedConversation(null)
  }

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

  if (isMobile && selectedConversation) {
    return (
      <Modal open={true} onClose={onClose} title={t('messages.title')} style={{ width: 'min(100vw, 1000px)', maxHeight: '95vh' }}>
        <MessageThread
          conversation={selectedConversation}
          user={user}
          onBack={handleBackToInbox}
          onClose={onClose}
          embedded={true}
        />
      </Modal>
    )
  }

  if (isMobile) {
    return (
      <Modal open={true} onClose={onClose} title={t('messages.title')} style={{ width: 'min(100vw, 1000px)', maxHeight: '95vh' }}>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          height: '70vh',
          overflow: 'hidden'
        }}>
          <div style={{
            padding: '12px 16px',
            borderBottom: '1px solid var(--fb-border)',
            background: 'var(--fb-white)'
          }}>
            <div style={{
              position: 'relative',
              display: 'flex',
              alignItems: 'center'
            }}>
              <i className="fa fa-search" style={{
                position: 'absolute',
                left: '12px',
                color: 'var(--fb-text-secondary)',
                fontSize: '14px'
              }}></i>
              <input
                ref={searchRef}
                type="text"
                placeholder={t('messages.search')}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px 8px 36px',
                  border: '1px solid var(--fb-border)',
                  borderRadius: '20px',
                  fontSize: '14px',
                  background: 'var(--fb-bg)',
                  outline: 'none'
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
                    color: 'var(--fb-text-secondary)',
                    fontSize: '14px'
                  }}
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          <div style={{
            flex: 1,
            overflowY: 'auto',
            background: 'var(--fb-bg)'
          }}>
            {loading ? (
              <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: '200px'
              }}>
                <div style={{
                  width: '24px',
                  height: '24px',
                  border: '3px solid #ddd',
                  borderTop: '3px solid var(--fb-blue)',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite'
                }}></div>
              </div>
            ) : filteredConversations.length === 0 ? (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: '200px',
                color: 'var(--fb-text-secondary)'
              }}>
                <i className="fa fa-comments" style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.5 }}></i>
                <p style={{ margin: 0, fontSize: '16px' }}>
                  {searchQuery ? t('messages.noSearchResults') : t('messages.noConversations')}
                </p>
              </div>
            ) : (
              filteredConversations.map(conversation => {
                const participants = JSON.parse(conversation.participants || '[]')
                const participantNames = JSON.parse(conversation.participantNames || '[]')
                const otherParticipant = participants.find(p => p !== user.email)
                const otherName = participantNames[participants.indexOf(otherParticipant)] || t('messages.unknown')
                const hasUnread = conversation.unreadCount > 0

                return (
                  <div
                    key={conversation.id}
                    onClick={() => handleConversationSelect(conversation)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      padding: '12px 16px',
                      cursor: 'pointer',
                      borderBottom: '1px solid var(--fb-border)',
                      background: selectedConversation?.id === conversation.id
                        ? 'var(--fb-hover)'
                        : hasUnread
                          ? 'rgba(24, 119, 242, 0.05)'
                          : 'var(--fb-white)',
                      transition: 'all 0.2s',
                      position: 'relative'
                    }}
                    onMouseEnter={e => {
                      if (selectedConversation?.id !== conversation.id) {
                        e.currentTarget.style.background = hasUnread
                          ? 'rgba(24, 119, 242, 0.08)'
                          : 'var(--fb-hover)'
                      }
                    }}
                    onMouseLeave={e => {
                      if (selectedConversation?.id !== conversation.id) {
                        e.currentTarget.style.background = hasUnread
                          ? 'rgba(24, 119, 242, 0.05)'
                          : 'var(--fb-white)'
                      }
                    }}
                  >
                    <div style={{ position: 'relative', marginRight: '12px' }}>
                      <div style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: '50%',
                        background: conversation.avatar ? `url(${conversation.avatar})` : 'linear-gradient(135deg, #667eea, #764ba2)',
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontWeight: '700',
                        fontSize: '18px',
                        flexShrink: 0,
                        border: hasUnread ? '2px solid var(--fb-blue)' : '2px solid var(--fb-border)'
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
                        background: 'var(--fb-green)',
                        border: '2px solid var(--fb-white)'
                      }}></div>
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
                          color: hasUnread ? 'var(--fb-blue)' : 'var(--fb-text)',
                          fontSize: '15px',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}>
                          {otherName}
                        </span>
                        <span style={{
                          fontSize: '12px',
                          color: hasUnread ? 'var(--fb-blue)' : 'var(--fb-text-secondary)',
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
                          color: hasUnread ? 'var(--fb-text)' : 'var(--fb-text-secondary)',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          fontWeight: hasUnread ? '500' : '400'
                        }}>
                          {conversation.lastMessage || t('messages.noMessages')}
                        </span>
                        {hasUnread && (
                          <div style={{
                            background: 'var(--fb-blue)',
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
      </Modal>
    )
  }

  return (
    <>
      <Modal open={true} onClose={onClose} style={{ width: '380px', maxHeight: '90vh' }} position="left" noHeader>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          height: '70vh',
          overflow: 'hidden'
        }}>
          <div style={{
            padding: '16px',
            borderBottom: '1px solid var(--fb-border)',
            background: 'var(--fb-white)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '600' }}>{t('messages.title')}</h2>
            <button 
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '8px',
                color: 'var(--fb-text-secondary)'
              }}
            >
              <i className="fas fa-times"></i>
            </button>
          </div>
          <div style={{
            padding: '12px 16px',
            borderBottom: '1px solid var(--fb-border)',
            background: 'var(--fb-white)'
          }}>
            <div style={{
              position: 'relative',
              display: 'flex',
              alignItems: 'center'
            }}>
              <i className="fa fa-search" style={{
                position: 'absolute',
                left: '12px',
                color: 'var(--fb-text-secondary)',
                fontSize: '14px'
              }}></i>
              <input
                ref={searchRef}
                type="text"
                placeholder={t('messages.search')}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px 8px 36px',
                  border: '1px solid var(--fb-border)',
                  borderRadius: '20px',
                  fontSize: '14px',
                  background: 'var(--fb-bg)',
                  outline: 'none'
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
                    color: 'var(--fb-text-secondary)',
                    fontSize: '14px'
                  }}
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          <div style={{
            flex: 1,
            overflowY: 'auto',
            background: 'var(--fb-bg)'
          }}>
            {loading ? (
              <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: '200px'
              }}>
                <div style={{
                  width: '24px',
                  height: '24px',
                  border: '3px solid #ddd',
                  borderTop: '3px solid var(--fb-blue)',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite'
                }}></div>
              </div>
            ) : filteredConversations.length === 0 ? (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: '200px',
                color: 'var(--fb-text-secondary)'
              }}>
                <i className="fa fa-comments" style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.5 }}></i>
                <p style={{ margin: 0, fontSize: '16px' }}>
                  {searchQuery ? t('messages.noSearchResults') : t('messages.noConversations')}
                </p>
              </div>
            ) : (
              filteredConversations.map(conversation => {
                const participants = JSON.parse(conversation.participants || '[]')
                const participantNames = JSON.parse(conversation.participantNames || '[]')
                const otherParticipant = participants.find(p => p !== user.email)
                const otherName = participantNames[participants.indexOf(otherParticipant)] || t('messages.unknown')
                const hasUnread = conversation.unreadCount > 0

                return (
                  <div
                    key={conversation.id}
                    onClick={() => handleConversationSelect(conversation)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      padding: '12px 16px',
                      cursor: 'pointer',
                      borderBottom: '1px solid var(--fb-border)',
                      background: selectedConversation?.id === conversation.id
                        ? 'var(--fb-hover)'
                        : hasUnread
                          ? 'rgba(24, 119, 242, 0.05)'
                          : 'var(--fb-white)',
                      transition: 'all 0.2s',
                      position: 'relative'
                    }}
                    onMouseEnter={e => {
                      if (selectedConversation?.id !== conversation.id) {
                        e.currentTarget.style.background = hasUnread
                          ? 'rgba(24, 119, 242, 0.08)'
                          : 'var(--fb-hover)'
                      }
                    }}
                    onMouseLeave={e => {
                      if (selectedConversation?.id !== conversation.id) {
                        e.currentTarget.style.background = hasUnread
                          ? 'rgba(24, 119, 242, 0.05)'
                          : 'var(--fb-white)'
                      }
                    }}
                  >
                    <div style={{ position: 'relative', marginRight: '12px' }}>
                      <div style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: '50%',
                        background: conversation.avatar ? `url(${conversation.avatar})` : 'linear-gradient(135deg, #667eea, #764ba2)',
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontWeight: '700',
                        fontSize: '18px',
                        flexShrink: 0,
                        border: hasUnread ? '2px solid var(--fb-blue)' : '2px solid var(--fb-border)'
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
                        background: 'var(--fb-green)',
                        border: '2px solid var(--fb-white)'
                      }}></div>
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
                          color: hasUnread ? 'var(--fb-blue)' : 'var(--fb-text)',
                          fontSize: '15px',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}>
                          {otherName}
                        </span>
                        <span style={{
                          fontSize: '12px',
                          color: hasUnread ? 'var(--fb-blue)' : 'var(--fb-text-secondary)',
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
                          color: hasUnread ? 'var(--fb-text)' : 'var(--fb-text-secondary)',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          fontWeight: hasUnread ? '500' : '400'
                        }}>
                          {conversation.lastMessage || t('messages.noMessages')}
                        </span>
                        {hasUnread && (
                          <div style={{
                            background: 'var(--fb-blue)',
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
      </Modal>

      {selectedConversation && (
        <Modal open={true} onClose={handleCloseChat} style={{ width: 'min(100vw, 700px)', maxHeight: '90vh' }} position="right" noHeader>
          <MessageThread
            conversation={selectedConversation}
            user={user}
            onBack={handleBackToInbox}
            onClose={handleCloseChat}
          />
        </Modal>
      )}
    </>
  )
}