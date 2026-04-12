import React from 'react'
import { ChatProvider, ChatSystem, ChatButton } from '../components/messages'

export default function ChatExample({ user }) {
  return (
    <ChatProvider>
      <div style={{ minHeight: '100vh', background: '#f0f2f5' }}>
        {/* Contenu de votre application */}
        <header style={{
          padding: '16px',
          background: '#ffffff',
          borderBottom: '1px solid #e4e6ea',
          fontSize: '20px',
          fontWeight: '600'
        }}>
          Unify - Application Example
        </header>

        <main style={{ padding: '20px' }}>
          <h1>Bienvenue dans Unify</h1>
          <p>Cette page montre comment intégrer le nouveau système de chat Facebook-like.</p>

          <div style={{
            background: '#ffffff',
            padding: '20px',
            borderRadius: '8px',
            margin: '20px 0'
          }}>
            <h2>Fonctionnalités du nouveau chat :</h2>
            <ul>
              <li>✅ Sidebar droite qui ne bloque pas la navigation</li>
              <li>✅ Palette de couleurs bleue Facebook</li>
              <li>✅ Indicateur de frappe (typing indicator)</li>
              <li>✅ Répondre aux messages</li>
              <li>✅ Réagir aux messages</li>
              <li>✅ Transfert de fichiers</li>
              <li>✅ Messages groupés</li>
              <li>✅ Status en ligne</li>
              <li>✅ Compteurs de messages non lus</li>
            </ul>
          </div>

          <p>
            Cliquez sur le bouton de chat flottant en bas à droite pour ouvrir le système de messagerie.
            Vous pouvez naviguer dans cette page même avec le chat ouvert !
          </p>
        </main>
      </div>

      {/* Bouton flottant du chat */}
      <ChatButton />

      {/* Système de chat */}
      <ChatSystem user={user} />
    </ChatProvider>
  )
}