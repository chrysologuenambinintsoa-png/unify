import React, { useState, useEffect, useRef } from 'react'
import { useChat } from './ChatSystem'
import { useTranslation } from '../../hooks/useTranslation'
import styles from './ChatSystem.module.css'

export default function ChatWindow({ conversation, user, onClose }) {
  const { t } = useTranslation()
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)
  const [newMessage, setNewMessage] = useState('')
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef(null)

  useEffect(() => {
    fetchMessages()
  }, [conversation?.id])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const fetchMessages = async () => {
    if (!conversation?.id) return

    try {
      setLoading(true)
      const res = await fetch(`/api/messages?conversationId=${conversation.id}`)
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

  const handleSendMessage = async (e) => {
    e.preventDefault()
    if (!newMessage.trim() || sending) return

    try {
      setSending(true)
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId: conversation.id,
          content: newMessage,
          senderEmail: user?.email,
          senderName: user?.name || user?.email
        })
      })

      if (res.ok) {
        const data = await res.json()
        setMessages([...messages, data.message])
        setNewMessage('')
      }
    } catch (error) {
      console.error('Failed to send message:', error)
    } finally {
      setSending(false)
    }
  }

  const participants = JSON.parse(conversation?.participantNames || '[]')
  const otherParticipants = participants.filter(name => name !== user?.email && name !== user?.name)

  return (
    <div
      className={styles.chatWindow}
      style={{
        position: 'fixed',
        top: 0,
        right: 0,
        width: '100%',
        maxWidth: '500px',
        height: '100vh',
        background: '#ffffff',
        borderLeft: '1px solid #e4e6ea',
        boxShadow: '-2px 0 12px rgba(0,0,0,0.15)',
        zIndex: 1001,
        display: 'flex',
        flexDirection: 'column',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        '@media (max-width: 768px)': {
          maxWidth: '100%',
          width: '100%'
        }
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
        <div>
          <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '500', color: '#000' }}>
            {otherParticipants.join(', ')}
          </h3>
        </div>
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '8px',
            borderRadius: '50%',
            color: '#65676b',
            fontSize: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'background 0.2s'
          }}
          onMouseEnter={(e) => (e.target.style.background = '#f0f0f0')}
          onMouseLeave={(e) => (e.target.style.background = 'none')}
        >
          âœ•
        </button>
      </div>

      {/* Messages */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}
      >
        {loading ? (
          <div style={{ textAlign: 'center', color: '#65676b' }}>
            {t('messages.loading')}...
          </div>
        ) : messages.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#65676b' }}>
            {t('messages.noMessages')}
          </div>
        ) : (
          messages.map((msg, idx) => (
            <div
              key={idx}
              style={{
                display: 'flex',
                justifyContent: msg.senderEmail === user?.email ? 'flex-end' : 'flex-start',
                marginBottom: '8px'
              }}
            >
              <div
                style={{
                  maxWidth: '70%',
                  padding: '8px 12px',
                  borderRadius: '18px',
                  background: msg.senderEmail === user?.email ? '#cce0f0' : '#e4e6eb',
                  color: '#000',
                  fontSize: '13px',
                  wordBreak: 'break-word'
                }}
              >
                {msg.content}
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Composer */}
      <form
        onSubmit={handleSendMessage}
        style={{
          padding: '16px',
          borderTop: '1px solid #e4e6ea',
          background: '#ffffff',
          display: 'flex',
          gap: '8px'
        }}
      >
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder={t('messages.typeMessage')}
          disabled={sending}
          style={{
            flex: 1,
            padding: '10px 16px',
            border: '1px solid #ccc',
            borderRadius: '20px',
            fontSize: '13px',
            fontFamily: 'inherit',
            outline: 'none',
            transition: 'border 0.2s'
          }}
          onFocus={(e) => (e.target.style.borderColor = '#0a66c2')}
          onBlur={(e) => (e.target.style.borderColor = '#ccc')}
        />
        <button
          type="submit"
          disabled={sending || !newMessage.trim()}
          style={{
            padding: '10px 16px',
            background: sending || !newMessage.trim() ? '#e4e6eb' : '#0a66c2',
            color: sending || !newMessage.trim() ? '#65676b' : '#fff',
            border: 'none',
            borderRadius: '20px',
            cursor: sending || !newMessage.trim() ? 'default' : 'pointer',
            fontSize: '13px',
            fontWeight: '500',
            transition: 'background 0.2s'
          }}
        >
          {sending ? '...' : 'â†’'}
        </button>
      </form>
    </div>
  )
}

