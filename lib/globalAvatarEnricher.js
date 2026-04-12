/**
 * Enrichisseur global d'avatars
 * Applique automatiquement les avatars SVG à TOUTE l'application
 * Sans nécessiter de modifications dans chaque composant
 */

import { generateAvatarSVG } from './generateAvatarSVG';

/**
 * Enrichit un objet utilisateur/auteur avec avatar SVG fallback
 * @param {object} user - Objet utilisateur
 * @returns {object} Objet enrichi
 */
export const enrichUserAvatar = (user) => {
  if (!user) return user;

  const originalAvatar = user.avatar || user.avatarUrl;
  
  return {
    ...user,
    // Garder l'original
    originalAvatar,
    // Avatar final (avec fallback SVG)
    displayAvatar: originalAvatar || generateAvatarSVG(user.name || user.prenom || 'User', 48),
    avatarUrl: originalAvatar || generateAvatarSVG(user.name || user.prenom || 'User', 48),
    avatar: originalAvatar || generateAvatarSVG(user.name || user.prenom || 'User', 48),
  };
};

/**
 * Enrichit un post avec avatars SVG
 */
export const enrichPost = (post) => {
  if (!post) return post;

  return {
    ...post,
    // Auteur du post
    author: enrichUserAvatar(post.author),
    // Commentaires
    comments: post.comments?.map(comment => ({
      ...comment,
      author: enrichUserAvatar(comment.author),
      replies: comment.replies?.map(reply => ({
        ...reply,
        author: enrichUserAvatar(reply.author),
      })),
    })),
  };
};

/**
 * Enrichit une story avec avatars SVG
 */
export const enrichStory = (story) => {
  if (!story) return story;

  return {
    ...story,
    author: enrichUserAvatar(story.author),
  };
};

/**
 * Enrichit un message avec avatars SVG
 */
export const enrichMessage = (message) => {
  if (!message) return message;

  return {
    ...message,
    author: enrichUserAvatar(message.author),
    sender: enrichUserAvatar(message.sender),
  };
};

/**
 * Enrichit une conversation avec avatars SVG
 */
export const enrichConversation = (conversation) => {
  if (!conversation) return conversation;

  return {
    ...conversation,
    author: enrichUserAvatar(conversation.author),
    members: conversation.members?.map(enrichUserAvatar),
  };
};

/**
 * Enrichit toutes les données d'une page
 * Fonction généque applicable à n'importe quelle structure
 */
export const enrichDataWithAvatars = (data, options = {}) => {
  if (!data) return data;

  const {
    type = 'generic', // 'post', 'story', 'message', 'conversation', 'generic'
    userField = 'author',
    recursiveFields = [],
  } = options;

  // Traitement par type
  if (type === 'post') {
    return enrichPost(data);
  } else if (type === 'story') {
    return enrichStory(data);
  } else if (type === 'message') {
    return enrichMessage(data);
  } else if (type === 'conversation') {
    return enrichConversation(data);
  }

  // Traitement générique
  if (Array.isArray(data)) {
    return data.map(item => enrichDataWithAvatars(item, options));
  }

  if (typeof data === 'object') {
    const enriched = { ...data };

    // Enrichir le champ utilisateur principal
    if (enriched[userField]) {
      enriched[userField] = enrichUserAvatar(enriched[userField]);
    }

    // Enrichir les champs récursifs
    if (recursiveFields && Array.isArray(recursiveFields)) {
      recursiveFields.forEach(field => {
        if (enriched[field] && Array.isArray(enriched[field])) {
          enriched[field] = enriched[field].map(item => enrichDataWithAvatars(item, options));
        }
      });
    }

    return enriched;
  }

  return data;
};

/**
 * Middleware pour enrichir automatiquement les réponses API
 * À utiliser dans les hooks ou intercepteurs
 */
export const createAvatarEnricher = (type = 'generic', userField = 'author') => {
  return (data) => enrichDataWithAvatars(data, { type, userField });
};

export default enrichUserAvatar;
