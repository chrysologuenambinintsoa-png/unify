import React, { useState, useRef } from 'react'
import { useTranslation } from '../../hooks/useTranslation'

export default function ChatComposer({
  conversationId,
  user,
  onMessageSent,
  replyTo,
  onReplyCancel,
  onTypingStart,
  onTypingStop
}) {
  const { t } = useTranslation()
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const textareaRef = useRef(null)
  const fileInputRef = useRef(null)
  const typingTimeoutRef = useRef(null)

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
          text: message.trim(),
          replyTo: replyTo?.id
        })
      })

      if (res.ok) {
        const newMessage = await res.json()
        onMessageSent(newMessage)
        setMessage('')
        onReplyCancel()
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
    const value = e.target.value
    setMessage(value)

    // Auto-resize textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`
    }

    // Handle typing indicator
    if (value.trim() && !typingTimeoutRef.current) {
      onTypingStart()
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }

    typingTimeoutRef.current = setTimeout(() => {
      onTypingStop()
      typingTimeoutRef.current = null
    }, 1000)
  }

  const handleFileSelect = (e) => {
    const file = e.target.files[0]
    if (file) {
      // Handle file upload
      console.log('File selected:', file)
      // TODO: Implement file upload functionality
    }
  }

  const handleEmojiSelect = (emoji) => {
    setMessage(prev => prev + emoji)
    setShowEmojiPicker(false)
    if (textareaRef.current) {
      textareaRef.current.focus()
    }
  }

  const emojis = ['ðŸ˜€', 'ðŸ˜‚', 'â¤ï¸', 'ðŸ‘', 'ðŸ‘Ž', 'ðŸ˜¢', 'ðŸ˜®', 'ðŸ˜', 'ðŸ¤”', 'ðŸ˜Ž']

  return (
    <div
      style={{
        padding: '12px 16px',
        borderTop: '1px solid #e4e6ea',
        background: '#ffffff',
        position: 'sticky',
        bottom: 0,
        boxShadow: '0 -1px 2px rgba(0,0,0,0.05)'
      }}
    >
      <form onSubmit={handleSubmit} style={{
        display: 'flex',
        alignItems: 'flex-end',
        gap: '8px',
        maxWidth: '100%'
      }}>
        {/* Attachment button */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '8px',
            borderRadius: '50%',
            color: '#65676b',
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
            e.currentTarget.style.background = '#f2f3f5'
            e.currentTarget.style.color = '#003d5c'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'transparent'
            e.currentTarget.style.color = '#65676b'
          }}
          title="Attach file"
        >
          <i className="fa fa-paperclip"></i>
        </button>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          style={{ display: 'none' }}
          onChange={handleFileSelect}
          accept="image/*,video/*,audio/*,application/*,text/*"
        />

        {/* Message input container */}
        <div
          style={{
            flex: 1,
            position: 'relative',
            background: '#f8f9fa',
            border: '1px solid #e4e6ea',
            borderRadius: '20px',
            padding: '8px 12px',
            minHeight: '40px',
            display: 'flex',
            alignItems: 'flex-end',
            transition: 'border-color 0.2s',
            ...(message.trim() ? { borderColor: '#003d5c' } : {})
          }}
        >
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
              color: '#1c1e21',
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
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '4px',
              borderRadius: '50%',
              color: '#65676b',
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
              e.currentTarget.style.background = '#f2f3f5'
              e.currentTarget.style.color = '#003d5c'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'transparent'
              e.currentTarget.style.color = '#65676b'
            }}
            title="Add emoji"
          >
            <i className="fa fa-smile-o"></i>
          </button>
        </div>

        {/* Send button */}
        <button
          type="submit"
          disabled={!message.trim() || sending}
          style={{
            background: message.trim() && !sending ? '#003d5c' : '#e4e6ea',
            border: 'none',
            cursor: message.trim() && !sending ? 'pointer' : 'not-allowed',
            padding: '0',
            borderRadius: '50%',
            color: message.trim() && !sending ? 'white' : '#65676b',
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
              e.currentTarget.style.background = '#002244'
              e.currentTarget.style.transform = 'scale(1.05)'
            }
          }}
          onMouseLeave={e => {
            if (message.trim() && !sending) {
              e.currentTarget.style.background = '#003d5c'
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
            }} />
          ) : (
            <i className="fa fa-paper-plane"></i>
          )}
        </button>
      </form>

      {/* Emoji picker */}
      {showEmojiPicker && (
        <div
          style={{
            position: 'absolute',
            bottom: '60px',
            left: '16px',
            right: '16px',
            background: '#ffffff',
            border: '1px solid #e4e6ea',
            borderRadius: '12px',
            padding: '12px',
            boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
            zIndex: 1000,
            display: 'grid',
            gridTemplateColumns: 'repeat(5, 1fr)',
            gap: '8px'
          }}
        >
          {emojis.map((emoji, index) => (
            <button
              key={index}
              onClick={() => handleEmojiSelect(emoji)}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '8px',
                borderRadius: '8px',
                fontSize: '24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s'
              }}
              onMouseEnter={e => e.currentTarget.style.background = '#f8f9fa'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              {emoji}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
