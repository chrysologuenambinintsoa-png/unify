import { useState, useRef, useEffect, useMemo } from 'react'

const EMOJI_LIST = [
  '😀', '😃', '😄', '😁', '😅', '😂', '🤣', '😊', '😇', '🙂', '😉', '😌',
  '😍', '🥰', '😘', '😗', '😙', '😚', '😋', '😛', '😜', '🤪', '😝', '🤗',
  '🤔', '🤭', '🤫', '🤥', '😶', '😐', '😑', '😬', '🙄', '😯', '😦', '😧',
  '😮', '😲', '🥱', '😴', '🤤', '😪', '😵', '🤐', '🥴', '🤢', '🤮', '🤧',
  '😷', '🤒', '🤕', '🤠', '😎', '🤓', '😜', '😝', '😶‍🌫️', '🧐', '😈', '👿',
  '💀', '☠️', '💩', '🤡', '👹', '👺', '👻', '👽', '👾', '🤖', '😺', '😸',
  '😹', '😻', '😼', '😽', '🙀', '😿', '😾', '🙈', '🙉', '🙊', '❤️', '🧡',
  '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💕', '💞', '💓',
  '💗', '💖', '💘', '💝', '👍', '👎', '👌', '✌️', '🤞', '🤟', '🤘', '🤙',
  '👈', '👉', '👆', '👇', '☝️', '✋', '🤚', '🖐️', '🖖', '👋', '🤏', '✍️',
  '👏', '🙌', '🤲', '🙏', '💪', '🤝', '🙇', '💁', '🙅', '🙆', '🧘', '🎖️',
  '🏆', '🥇', '🥈', '🥉', '⚽', '⚾', '🏀', '🏈', '🎾', '🏐', '🎱', '🏉',
  '🎳', '⛳', '🎮', '🎰', '🎱', '🎬', '🎤', '🎧', '🎼', '🎹', '🥁', '🎷',
  '🎺', '🎸', '🪕', '🎻', '🌟', '✨', '💫', '🔥', '💥', '💯', '�奖', '❄️',
  '🌈', '☀️', '🌙', '⛈️', '🌊', '🎉', '🎊', '🎁', '🎈', '❤️', '💔', '❣️'
]

export default function EmojiPicker({ onSelect, isOpen, onClose, position = 'bottom' }) {
  const pickerRef = useRef(null)
  const [searchQuery, setSearchQuery] = useState('')

  const filteredEmojis = useMemo(() => {
    if (!searchQuery.trim()) {
      return EMOJI_LIST
    }
    return EMOJI_LIST
  }, [searchQuery])

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target)) {
        const toggleBtn = document.querySelector('.emoji-picker-toggle')
        if (toggleBtn && toggleBtn.contains(event.target)) {
          return
        }
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

  const handleEmojiClick = (emoji) => {
    onSelect(emoji)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div ref={pickerRef} className={`emoji-picker-simple ${position}`}>
      <style jsx>{`
        .emoji-picker-simple {
          position: absolute;
          z-index: 1000;
          background: #fff;
          border-radius: 10px;
          box-shadow: 0 2px 16px rgba(0, 0, 0, 0.2);
          width: 290px;
          height: 280px;
          display: flex;
          flex-direction: column;
        }

        .emoji-picker-simple.bottom {
          bottom: 100%;
          left: 0;
          margin-bottom: 8px;
        }

        .emoji-picker-simple.top {
          top: 100%;
          left: 0;
          margin-top: 8px;
        }

        .emoji-picker-simple.bottom:before,
        .emoji-picker-simple.bottom:after {
          content: '';
          position: absolute;
          border: 6px solid transparent;
          border-top-color: #fff;
          bottom: -12px;
          left: 20px;
        }

        .emoji-picker-simple.bottom:before {
          bottom: -14px;
          border-top-color: rgba(0,0,0,0.1);
        }

        .emoji-search {
          padding: 10px 12px;
          border-bottom: 1px solid #efeff0;
        }

        .emoji-search input {
          width: 100%;
          padding: 8px 12px;
          border: none;
          border-radius: 20px;
          background: #f0f2f5;
          font-size: 14px;
          outline: none;
        }

        .emoji-search input:focus {
          background: #fff;
          box-shadow: 0 0 0 2px #1877f2;
        }

        .emoji-grid-container {
          flex: 1;
          overflow-y: auto;
          padding: 8px;
        }

        .emoji-grid-container::-webkit-scrollbar {
          width: 6px;
        }

        .emoji-grid-container::-webkit-scrollbar-track {
          background: transparent;
        }

        .emoji-grid-container::-webkit-scrollbar-thumb {
          background: #ccc;
          border-radius: 3px;
        }

        .emoji-grid {
          display: grid;
          grid-template-columns: repeat(8, 1fr);
          gap: 2px;
        }

        .emoji-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          border: none;
          background: transparent;
          border-radius: 4px;
          cursor: pointer;
          font-size: 22px;
          transition: background 0.15s;
        }

        .emoji-btn:hover {
          background: #e4e6eb;
        }

        @media (max-width: 480px) {
          .emoji-picker-simple {
            width: calc(100vw - 32px);
            left: 50% !important;
            transform: translateX(-50%);
          }
        }
      `}</style>

      <div className="emoji-search">
        <input
          type="text"
          placeholder="Rechercher emoji..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="emoji-grid-container">
        <div className="emoji-grid">
          {filteredEmojis.slice(0, 168).map((emoji, idx) => (
            <button
              key={idx}
              className="emoji-btn"
              onClick={() => handleEmojiClick(emoji)}
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
