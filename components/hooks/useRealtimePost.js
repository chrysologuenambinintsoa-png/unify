/**
 * useRealtimePost.js - Hook pour les mises à jour en temps réel des posts
 * Utilise le polling pour récupérer les mises à jour des posts
 */

import { useState, useEffect, useCallback, useRef } from 'react'

export const useRealtimePost = (postId, initialPost = null) => {
  const [post, setPost] = useState(initialPost)
  const [isUpdating, setIsUpdating] = useState(false)
  const [lastUpdate, setLastUpdate] = useState(Date.now())
  const pollingIntervalRef = useRef(null)
  const previousPostRef = useRef(initialPost)

  // Fonction pour récupérer les mises à jour du post
  const fetchPostUpdate = useCallback(async () => {
    if (!postId || String(postId).startsWith('temp-') || String(postId).startsWith('sponsor-')) return

    try {
      setIsUpdating(true)
      const response = await fetch(`/api/items/${postId}`)
      
      if (response.ok) {
        const updatedPost = await response.json()
        
        // Préserver les champs 'date' et 'createdAt' du post initial si l'API ne les retourne pas
        if (previousPostRef.current?.date && !updatedPost.date) {
          updatedPost.date = previousPostRef.current.date
        }
        if (previousPostRef.current?.createdAt && !updatedPost.createdAt) {
          updatedPost.createdAt = previousPostRef.current.createdAt
        }
        
        // Vérifier si le post a changé
        const hasChanged = JSON.stringify(updatedPost) !== JSON.stringify(previousPostRef.current)
        
        if (hasChanged) {
          console.log('[RealtimePost] Post mis à jour:', postId)
          setPost(updatedPost)
          previousPostRef.current = updatedPost
          setLastUpdate(Date.now())
        }
      }
    } catch (error) {
      console.error('[RealtimePost] Erreur lors de la récupération du post:', error)
    } finally {
      setIsUpdating(false)
    }
  }, [postId])

  // Démarrer le polling pour les mises à jour
  useEffect(() => {
    if (!postId || String(postId).startsWith('temp-')) return

    // Récupérer immédiatement les mises à jour
    fetchPostUpdate()

    // Configurer le polling toutes les 10 secondes
    pollingIntervalRef.current = setInterval(() => {
      fetchPostUpdate()
    }, 10000) // 10 secondes

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current)
      }
    }
  }, [postId, fetchPostUpdate])

  // Mettre à jour le post initial si il change
  useEffect(() => {
    if (initialPost && JSON.stringify(initialPost) !== JSON.stringify(previousPostRef.current)) {
      setPost(initialPost)
      previousPostRef.current = initialPost
    }
  }, [initialPost])

  // Fonction pour forcer une mise à jour
  const forceUpdate = useCallback(() => {
    fetchPostUpdate()
  }, [fetchPostUpdate])

  return {
    post,
    isUpdating,
    lastUpdate,
    forceUpdate
  }
}

export default useRealtimePost
