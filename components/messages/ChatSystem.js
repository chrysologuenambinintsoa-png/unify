import React, { useState, useEffect, useRef, createContext, useContext } from 'react'
import { useTranslation } from '../../hooks/useTranslation'
import styles from './ChatSystem.module.css'
import ChatSidebar from './ChatSidebar'
import ChatWindow from './ChatWindow'

// Chat Context pour gérer l'état global du chat
const ChatContext = createContext()

export const useChat = () => {
  const context = useContext(ChatContext)
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider')
  }
  return context
}

export const ChatProvider = ({ children }) => {
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [selectedConversation, setSelectedConversation] = useState(null)
  const [conversations, setConversations] = useState([])
  const [typingUsers, setTypingUsers] = useState(new Map())

  const value = {
    isChatOpen,
    setIsChatOpen,
    selectedConversation,
    setSelectedConversation,
    conversations,
    setConversations,
    typingUsers,
    setTypingUsers
  }

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  )
}

// Composant principal du système de chat
export default function ChatSystem({ user }) {
  const { isChatOpen, selectedConversation, setSelectedConversation } = useChat()

  if (!isChatOpen) return null

  return (
    <>
      {/* Overlay pour mobile */}
      <div
        className={styles.chatOverlay}
        onClick={() => setSelectedConversation(null)}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.3)',
          zIndex: 999,
          display: window.innerWidth <= 768 ? 'block' : 'none'
        }}
      />

      {/* Sidebar des conversations */}
      <ChatSidebar user={user} />

      {/* Fenêtre de chat */}
      {selectedConversation && (
        <ChatWindow
          conversation={selectedConversation}
          user={user}
          onClose={() => setSelectedConversation(null)}
        />
      )}
    </>
  )
}