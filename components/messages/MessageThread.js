import React, { useState, useEffect, useRef } from 'react'
import MessageComposer from './MessageComposer'
import { useTranslation } from '../../hooks/useTranslation'

export default function MessageThread({ conversation, user, onBack, onClose }) {
  const { t } = useTranslation()
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)
  const [isMobile, setIsMobile] = useState(false)
  const messagesEndRef = useRef(null)
  const messagesContainerRef = useRef(null)

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768)
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    if (conversation) {
      fetchMessages()
    }
  }, [conversation?.id])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const fetchMessages = async () => {
    if (!conversation?.id) return

    try {
      setLoading(true)
      const res = await fetch(`/api/messages/conversation/${conversation.id}`)
      if (res.ok) {
        const data = await res.json()
        setMessages(data.messages || [])
      }
    } catch (error) {
      console.error('Failed to fetch messages:', error)
    } finally {
      setLoading(false)
    }
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleNewMessage = (newMessage) => {
    setMessages(prev => [...prev, newMessage])
  }

  const formatMessageTime = (dateString) => {
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

  const participants = JSON.parse(conversation?.participants || '[]')
  const participantNames = JSON.parse(conversation?.participantNames || '[]')
  const otherParticipant = participants.find(p => p !== user.email)
  const otherName = participantNames[participants.indexOf(otherParticipant)] || t('messages.unknown')

  return (
    <div className="message-thread" style={{
      position: isMobile ? 'fixed' : 'relative',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'var(--fb-white)',
      zIndex: 1000,
      display: 'flex',
      flexDirection: 'column',
      ...(isMobile ? {} : {
        width: '400px',
        borderLeft: '1px solid var(--fb-border)',
        boxShadow: '-2px 0 8px rgba(0,0,0,0.1)'
      })
    }}>
      {/* Header */}
      <div style={{
        padding: '12px 16px',
        borderBottom: '1px solid var(--fb-border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: 'var(--fb-white)',
        position: 'sticky',
        top: 0,
        zIndex: 10,
        boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {isMobile && (
            <button
              onClick={onBack}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '8px',
                borderRadius: '50%',
                color: 'var(--fb-text)',
                fontSize: '18px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '40px',
                height: '40px',
                transition: 'all 0.2s'
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = 'var(--fb-hover)'
                e.currentTarget.style.transform = 'scale(1.05)'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'transparent'
                e.currentTarget.style.transform = 'scale(1)'
              }}
            >
              ←
            </button>
          )}
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            background: conversation.avatar ? `url(${conversation.avatar})` : 'linear-gradient(135deg, #667eea, #764ba2)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontWeight: '700',
            fontSize: '16px',
            flexShrink: 0,
            border: '2px solid var(--fb-border)'
          }}>
            {!conversation.avatar && otherName[0]}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h3 style={{
              margin: 0,
              fontSize: '16px',
              fontWeight: '600',
              color: 'var(--fb-text)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}>
              {otherName}
            </h3>
            <span style={{
              fontSize: '13px',
              color: 'var(--fb-text-secondary)',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}>
              <span style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: 'var(--fb-green)',
                display: 'inline-block'
              }}></span>
              Active now
            </span>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Call button */}
          <button
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '8px',
              borderRadius: '50%',
              color: 'var(--fb-text)',
              fontSize: '18px',
              width: '40px',
              height: '40px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s'
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'var(--fb-hover)'
              e.currentTarget.style.transform = 'scale(1.05)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'transparent'
              e.currentTarget.style.transform = 'scale(1)'
            }}
            title="Start a call"
          >
            <i className="fa fa-phone"></i>
          </button>

          {/* Video call button */}
          <button
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '8px',
              borderRadius: '50%',
              color: 'var(--fb-text)',
              fontSize: '18px',
              width: '40px',
              height: '40px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s'
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'var(--fb-hover)'
              e.currentTarget.style.transform = 'scale(1.05)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'transparent'
              e.currentTarget.style.transform = 'scale(1)'
            }}
            title="Start a video call"
          >
            <i className="fa fa-video-camera"></i>
          </button>

          {!isMobile && (
            <button
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '8px',
                borderRadius: '50%',
                color: 'var(--fb-text)',
                fontSize: '18px',
                width: '40px',
                height: '40px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s'
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = 'var(--fb-hover)'
                e.currentTarget.style.transform = 'scale(1.05)'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'transparent'
                e.currentTarget.style.transform = 'scale(1)'
              }}
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Messages */}
      <div
        ref={messagesContainerRef}
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '16px',
          background: 'var(--fb-bg)',
          display: 'flex',
          flexDirection: 'column',
          gap: '0',
          backgroundImage: 'linear-gradient(180deg, rgba(255,255,255,0.02) 0%, rgba(255,255,255,0.05) 100%)'
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
              borderTop: '3px solid var(--fb-blue)',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }}></div>
          </div>
        ) : messages.length === 0 ? (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '300px',
            color: 'var(--fb-text-secondary)',
            textAlign: 'center'
          }}>
            <div style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              background: 'var(--fb-hover)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '16px'
            }}>
              <i className="fa fa-comments" style={{
                fontSize: '32px',
                color: 'var(--fb-text-secondary)',
                opacity: 0.6
              }}></i>
            </div>
            <h3 style={{
              margin: '0 0 8px 0',
              fontSize: '18px',
              fontWeight: '600',
              color: 'var(--fb-text)'
            }}>
              Start a conversation
            </h3>
            <p style={{
              margin: 0,
              fontSize: '14px',
              lineHeight: '1.4',
              maxWidth: '280px'
            }}>
              Send a message to start chatting with {otherName}.
            </p>
          </div>
        ) : (
          messages.map((message, index) => {
            const isOwnMessage = message.senderEmail === user.email
            const prevMessage = messages[index - 1]
            const nextMessage = messages[index + 1]

            // Group consecutive messages from same sender
            const isFirstInGroup = !prevMessage || prevMessage.senderEmail !== message.senderEmail
            const isLastInGroup = !nextMessage || nextMessage.senderEmail !== message.senderEmail

            // Show avatar only for first message in group from other user
            const showAvatar = !isOwnMessage && isFirstInGroup

            // Determine bubble shape based on position in group
            const getBorderRadius = () => {
              if (isOwnMessage) {
                if (isFirstInGroup && isLastInGroup) return '18px' // Single message
                if (isFirstInGroup) return '18px 18px 4px 18px' // First in group
                if (isLastInGroup) return '18px 4px 18px 18px' // Last in group
                return '18px 4px 4px 18px' // Middle in group
              } else {
                if (isFirstInGroup && isLastInGroup) return '18px' // Single message
                if (isFirstInGroup) return '18px 18px 18px 4px' // First in group
                if (isLastInGroup) return '4px 18px 18px 18px' // Last in group
                return '4px 18px 18px 4px' // Middle in group
              }
            }

            return (
              <div
                key={message.id}
                style={{
                  display: 'flex',
                  flexDirection: isOwnMessage ? 'row-reverse' : 'row',
                  alignItems: 'flex-end',
                  gap: '8px',
                  marginBottom: isLastInGroup ? '12px' : '2px',
                  paddingLeft: isOwnMessage ? '80px' : '0',
                  paddingRight: isOwnMessage ? '0' : '80px'
                }}
              >
                {/* Avatar for other user - only show for first message in group */}
                {showAvatar && (
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    background: conversation.avatar ? `url(${conversation.avatar})` : 'linear-gradient(135deg, #667eea, #764ba2)',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontWeight: '700',
                    fontSize: '14px',
                    flexShrink: 0,
                    marginBottom: '4px'
                  }}>
                    {!conversation.avatar && otherName[0]}
                  </div>
                )}

                {/* Spacer for own messages or middle messages in group */}
                {(!showAvatar && !isOwnMessage) && <div style={{ width: '32px', flexShrink: 0 }}></div>}

                {/* Message bubble container */}
                <div style={{
                  maxWidth: '65%',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: isOwnMessage ? 'flex-end' : 'flex-start',
                  position: 'relative'
                }}>
                  {/* Message bubble */}
                  <div style={{
                    background: isOwnMessage ? 'var(--fb-blue)' : 'var(--fb-white)',
                    color: isOwnMessage ? 'white' : 'var(--fb-text)',
                    padding: '8px 12px',
                    borderRadius: getBorderRadius(),
                    border: isOwnMessage ? 'none' : '1px solid var(--fb-border)',
                    wordWrap: 'break-word',
                    fontSize: '14px',
                    lineHeight: '1.4',
                    boxShadow: isOwnMessage
                      ? '0 1px 2px rgba(0,0,0,0.1)'
                      : '0 1px 2px rgba(0,0,0,0.1), inset 0 1px 0 rgba(255,255,255,0.1)',
                    position: 'relative',
                    marginBottom: '2px'
                  }}>
                    {message.text}
                  </div>

                  {/* Timestamp - show below last message in group */}
                  {isLastInGroup && (
                    <div style={{
                      fontSize: '11px',
                      color: 'var(--fb-text-secondary)',
                      marginTop: '2px',
                      padding: isOwnMessage ? '0 12px 0 0' : '0 0 0 12px',
                      opacity: 0.7
                    }}>
                      {formatMessageTime(message.createdAt)}
                    </div>
                  )}
                </div>
              </div>
            )
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Composer */}
      <MessageComposer
        conversationId={conversation.id}
        user={user}
        onMessageSent={handleNewMessage}
      />
    </div>
  )
}