import React, { useState, useRef } from 'react'
import { useTranslation } from '../../hooks/useTranslation'

export default function MessageComposer({ conversationId, user, onMessageSent }) {
  const { t } = useTranslation()
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const textareaRef = useRef(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!message.trim() || sending) return

    try {
      setSending(true)
      const res = await fetch('/api/messages/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          conversationId,
          senderEmail: user.email,
          senderName: `${user.prenom || ''} ${user.nom || ''}`.trim() || user.email,
          text: message.trim()
        })
      })

      if (res.ok) {
        const newMessage = await res.json()
        onMessageSent(newMessage)
        setMessage('')
        // Reset textarea height
        if (textareaRef.current) {
          textareaRef.current.style.height = 'auto'
        }
      } else {
        console.error('Failed to send message')
      }
    } catch (error) {
      console.error('Error sending message:', error)
    } finally {
      setSending(false)
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  const handleInputChange = (e) => {
    setMessage(e.target.value)

    // Auto-resize textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`
    }
  }

  return (
    <div style={{
      padding: '12px 16px',
      borderTop: '1px solid var(--fb-border)',
      background: 'var(--fb-white)',
      position: 'sticky',
      bottom: 0,
      boxShadow: '0 -1px 2px rgba(0,0,0,0.05)'
    }}>
      <form onSubmit={handleSubmit} style={{
        display: 'flex',
        alignItems: 'flex-end',
        gap: '8px',
        maxWidth: '100%'
      }}>
        {/* Attachment button */}
        <button
          type="button"
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '8px',
            borderRadius: '50%',
            color: 'var(--fb-text-secondary)',
            fontSize: '20px',
            flexShrink: 0,
            width: '40px',
            height: '40px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s'
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = 'var(--fb-hover)'
            e.currentTarget.style.color = 'var(--fb-blue)'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'transparent'
            e.currentTarget.style.color = 'var(--fb-text-secondary)'
          }}
          title={t('messages.attach')}
        >
          <i className="fa fa-plus"></i>
        </button>

        {/* Message input container */}
        <div style={{
          flex: 1,
          position: 'relative',
          background: 'var(--fb-bg)',
          border: '1px solid var(--fb-border)',
          borderRadius: '20px',
          padding: '8px 12px',
          minHeight: '40px',
          display: 'flex',
          alignItems: 'flex-end',
          transition: 'border-color 0.2s',
          ...(message.trim() ? { borderColor: 'var(--fb-blue)' } : {})
        }}>
          <textarea
            ref={textareaRef}
            value={message}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            placeholder={t('messages.typeMessage')}
            style={{
              flex: 1,
              border: 'none',
              background: 'transparent',
              outline: 'none',
              resize: 'none',
              fontSize: '14px',
              lineHeight: '1.4',
              color: 'var(--fb-text)',
              fontFamily: 'inherit',
              minHeight: '20px',
              maxHeight: '120px',
              overflowY: message.split('\n').length > 3 ? 'auto' : 'hidden',
              padding: '2px 0'
            }}
            rows={1}
          />

          {/* Emoji button */}
          <button
            type="button"
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '4px',
              borderRadius: '50%',
              color: 'var(--fb-text-secondary)',
              fontSize: '20px',
              marginLeft: '4px',
              flexShrink: 0,
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s'
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'var(--fb-hover)'
              e.currentTarget.style.color = 'var(--fb-blue)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'transparent'
              e.currentTarget.style.color = 'var(--fb-text-secondary)'
            }}
            title="Ajouter un emoji"
          >
            <i className="fa fa-smile-o"></i>
          </button>
        </div>

        {/* Send button */}
        <button
          type="submit"
          disabled={!message.trim() || sending}
          style={{
            background: message.trim() && !sending ? 'var(--fb-blue)' : '#e4e6ea',
            border: 'none',
            cursor: message.trim() && !sending ? 'pointer' : 'not-allowed',
            padding: '0',
            borderRadius: '50%',
            color: message.trim() && !sending ? 'white' : 'var(--fb-text-secondary)',
            fontSize: '16px',
            flexShrink: 0,
            width: '40px',
            height: '40px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s',
            boxShadow: message.trim() && !sending ? '0 2px 4px rgba(0,0,0,0.1)' : 'none'
          }}
          onMouseEnter={e => {
            if (message.trim() && !sending) {
              e.currentTarget.style.background = '#0a2e6b'
              e.currentTarget.style.transform = 'scale(1.05)'
            }
          }}
          onMouseLeave={e => {
            if (message.trim() && !sending) {
              e.currentTarget.style.background = 'var(--fb-blue)'
              e.currentTarget.style.transform = 'scale(1)'
            }
          }}
          title={t('messages.send')}
        >
          {sending ? (
            <div style={{
              width: '16px',
              height: '16px',
              border: '2px solid rgba(255,255,255,0.3)',
              borderTop: '2px solid white',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }}></div>
          ) : (
            <i className="fa fa-paper-plane"></i>
          )}
        </button>
      </form>
    </div>
  )
}