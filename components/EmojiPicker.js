import { useState, useRef, useEffect } from 'react'

export default function EmojiPicker({ onSelect, currentReaction, isOpen, onClose }) {
  const pickerRef = useRef(null)
  const [hoveredEmoji, setHoveredEmoji] = useState(null)

  const emojis = [
    { type: 'like', emoji: '👍', label: 'J\'aime', color: '#0B3D91', isFontAwesome: true, icon: 'fa-thumbs-up' },
    { type: 'love', emoji: '❤️', label: 'J\'adore', color: '#ffffff' },
    { type: 'haha', emoji: '😂', label: 'Haha', color: '#FFA500' },
    { type: 'wow', emoji: '😮', label: 'Waooo', color: '#8B5CF6' },
    { type: 'sad', emoji: '😢', label: 'Triste', color: '#6B7280' },
    { type: 'solidarity', emoji: '🤝', label: 'Solidaire', color: '#10B981' }
  ]

  const animationMap = {
    like: { name: 'emojiBounce', duration: '1.4s', delay: '0s' },
    love: { name: 'emojiPulse', duration: '1.7s', delay: '0.05s' },
    haha: { name: 'emojiWobble', duration: '1.75s', delay: '0.1s' },
    wow: { name: 'emojiFloat', duration: '1.85s', delay: '0.12s' },
    sad: { name: 'emojiSwing', duration: '1.7s', delay: '0.08s' },
    solidarity: { name: 'emojiPop', duration: '1.6s', delay: '0.06s' }
  }

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target)) {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div className="emoji-picker-container" ref={pickerRef}>
      <div className="emoji-picker-popup">
        {emojis.map((item, index) => (
          <button
            key={item.type}
            className={`emoji-picker-btn ${currentReaction === item.type ? 'active' : ''}`}
            onClick={(e) => {
              e.stopPropagation()
              onSelect(item.type)
              onClose()
            }}
            onMouseEnter={() => setHoveredEmoji(item.type)}
            onMouseLeave={() => setHoveredEmoji(null)}
            style={{
              animationDelay: `${index * 0.05}s`
            }}
            aria-label={item.label}
          >
            <span 
              className={`emoji-picker-emoji ${hoveredEmoji === item.type ? 'hovered' : ''}`}
              style={{
                filter: currentReaction === item.type ? `drop-shadow(0 0 8px ${item.color})` : 'none',
                animationName: animationMap[item.type]?.name || 'emojiPulse',
                animationDuration: animationMap[item.type]?.duration || '1.7s',
                animationTimingFunction: 'ease-in-out',
                animationIterationCount: 'infinite',
                animationDelay: animationMap[item.type]?.delay || `${index * 0.05}s`,
                '--emoji-index': index
              }}
            >
              {item.isFontAwesome ? (
                <i className={`fas ${item.icon}`} style={{ color: item.color, fontSize: '34px' }}></i>
              ) : (
                item.emoji
              )}
            </span>
            <span className="emoji-picker-label">{item.label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
