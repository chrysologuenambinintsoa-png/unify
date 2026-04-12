/**
 * Génère un avatar SVG personnalisé basé sur les initiales et un hash du nom
 * @param {string} name - Le nom de l'utilisateur
 * @param {number} size - Taille de l'avatar en pixels (par défaut 48)
 * @returns {string} Data URI du SVG
 */
export const generateAvatarSVG = (name = 'User', size = 48) => {
  // Extraire les initiales
  const initials = name
    .trim()
    .split(' ')
    .slice(0, 2)
    .map(part => part.charAt(0).toUpperCase())
    .join('')
    .slice(0, 2) || '?';

  // Générer une couleur basée sur le hash du nom
  const colors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8',
    '#F7DC6F', '#BB8FCE', '#85C1E2', '#F8B88B', '#52C09E',
    '#FF88DC', '#5DADE2', '#F1948A', '#82E0AA', '#F5B041',
    '#A9DFBF', '#D7BDE2', '#F9E79F', '#ABEBC6', '#F4D03F',
  ];

  const hash = name.split('').reduce((acc, char) => {
    return acc + char.charCodeAt(0);
  }, 0);
  
  const bgColor = colors[hash % colors.length];
  const textColor = '#FFFFFF';

  // Créer le SVG
  const svg = `
    <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <style>
          .avatar-bg { fill: ${bgColor}; }
          .avatar-text { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            font-size: ${size * 0.4}px;
            font-weight: 600;
            fill: ${textColor};
            text-anchor: middle;
            dominant-baseline: middle;
          }
        </style>
      </defs>
      <circle cx="${size / 2}" cy="${size / 2}" r="${size / 2}" class="avatar-bg" />
      <text x="${size / 2}" y="${size / 2}" class="avatar-text">${initials}</text>
    </svg>
  `;

  // Convertir en data URI
  const encodedSvg = btoa(svg);
  return `data:image/svg+xml;base64,${encodedSvg}`;
};

/**
 * Obtient un avatar SVG ou une URL existante
 * @param {string} avatarUrl - URL de l'avatar (peut être null/undefined)
 * @param {string} name - Nom utilisé pour générer le SVG
 * @param {number} size - Taille en pixels
 * @returns {string} URL valide pour afficher l'avatar
 */
export const getAvatarUrl = (avatarUrl, name = 'User', size = 48) => {
  if (avatarUrl && avatarUrl.trim()) {
    return avatarUrl;
  }
  return generateAvatarSVG(name, size);
};

/**
 * Convertit une liste d'utilisateurs pour ajouter des avatars SVG
 * @param {array} users - Liste d'utilisateurs avec ou sans avatar
 * @param {string} avatarField - Nom du champ avatar (par défaut 'avatar')
 * @param {string} nameField - Nom du champ nom (par défaut 'name')
 * @param {number} size - Taille en pixels
 * @returns {array} Liste d'utilisateurs avec avatarUrl défini
 */
export const enrichUsersWithAvatars = (
  users = [],
  avatarField = 'avatar',
  nameField = 'name',
  size = 48
) => {
  return users.map(user => ({
    ...user,
    avatarUrl: getAvatarUrl(user[avatarField], user[nameField], size),
    // Garder aussi l'original
    [avatarField]: user[avatarField],
  }));
};

export default generateAvatarSVG;
