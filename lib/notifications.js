import prisma from './prisma'

/**
 * Create a notification for a user.
 *
 * @param {Object} opts
 * @param {number|string} opts.userId - ID of the user who will receive the notification
 * @param {string} opts.type - Type of notification (like, comment, reply, friend, message, login, etc.)
 * @param {number|string} [opts.actorId] - ID of the user who triggered the notification
 * @param {string} [opts.content] - Optional human-readable content
 * @param {string} [opts.url] - Optional URL the notification should link to
 */
export async function createNotification({ userId, type, actorId = null, content = null, url = null }) {
  if (!userId || !type) {
    throw new Error('userId and type are required to create a notification')
  }

  const data = {
    userId: parseInt(userId, 10),
    type,
    content,
    url,
    actorId: actorId ? parseInt(actorId, 10) : null,
  }

  return prisma.notification.create({ data })
}

/**
 * Fetch notifications for a given user (ordered descending by date)
 */
export async function getNotificationsForUser(userId, { unreadOnly = false } = {}) {
  const where = { userId: parseInt(userId, 10) }
  if (unreadOnly) where.read = false
  return prisma.notification.findMany({
    where,
    orderBy: { createdAt: 'desc' },
  })
}
