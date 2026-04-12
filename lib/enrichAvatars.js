/**
 * Script de migration pour ajouter automatiquement les avatars SVG
 * aux données existantes des utilisateurs et conversations
 */

import { enrichUsersWithAvatars, generateAvatarSVG } from './generateAvatarSVG';

/**
 * Enrichit une liste de conversations avec des avatars SVG
 * @param {array} conversations - Liste des conversations
 * @returns {array} Conversations enrichies
 */
export const enrichConversationsWithAvatars = (conversations = []) => {
  return conversations.map(conv => {
    const enriched = {
      ...conv,
      // Avatar principal de la conversation
      avatarUrl: conv.avatar || generateAvatarSVG(conv.name),
    };

    // Avatars des membres du groupe
    if (conv.members && Array.isArray(conv.members)) {
      enriched.members = conv.members.map(member => ({
        ...member,
        avatarUrl: member.avatar || generateAvatarSVG(member.name),
      }));
    }

    return enriched;
  });
};

/**
 * Enrichit une liste de messages avec des avatars SVG pour les auteurs
 * @param {array} messages - Liste des messages
 * @returns {array} Messages enrichis
 */
export const enrichMessagesWithAvatars = (messages = []) => {
  return messages.map(msg => {
    const author = msg.author || msg.sender || {};
    return {
      ...msg,
      author: {
        ...author,
        avatarUrl: author.avatar || generateAvatarSVG(author.name || 'Unknown'),
      },
    };
  });
};

/**
 * Enrichit les utilisateurs avec avatars SVG
 * @param {array} users - Liste des utilisateurs
 * @returns {array} Utilisateurs enrichis
 */
export const enrichUsersAvatars = (users = []) => {
  return enrichUsersWithAvatars(users, 'avatar', 'name', 48);
};

/**
 * Fonction généraliste pour enrichir n'importe quel objet avec avatar
 * @param {object} obj - Objet avec champs avatar et name
 * @param {string} avatarField - Champ avatar (par défaut 'avatar')
 * @param {string} nameField - Champ nom (par défaut 'name')
 * @returns {object} Objet enrichi
 */
export const enrichObjectWithAvatar = (
  obj,
  avatarField = 'avatar',
  nameField = 'name'
) => {
  if (!obj) return obj;

  return {
    ...obj,
    avatarUrl: obj[avatarField] || generateAvatarSVG(obj[nameField] || 'User'),
  };
};

/**
 * Enrichit les données dans l'API ou une réponse serveur
 * @param {array} items - Items à enrichir
 * @param {object} options - Options
 *  - type: 'users' | 'conversations' | 'messages' | 'generic'
 *  - avatarField: Nom du champ avatar
 *  - nameField: Nom du champ nom
 * @returns {array} Items enrichis
 */
export const enrichData = (
  items,
  {
    type = 'generic',
    avatarField = 'avatar',
    nameField = 'name',
  } = {}
) => {
  if (!items) return items;

  switch (type) {
    case 'users':
      return enrichUsersAvatars(items);
    case 'conversations':
      return enrichConversationsWithAvatars(items);
    case 'messages':
      return enrichMessagesWithAvatars(items);
    case 'generic':
    default:
      return items.map(item =>
        enrichObjectWithAvatar(item, avatarField, nameField)
      );
  }
};

export default enrichData;
