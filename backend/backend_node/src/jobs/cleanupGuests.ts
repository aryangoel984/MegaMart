import prisma from '../config/db';

/**
 * Deletes guest accounts (see POST /api/auth/guest) past their expiresAt.
 * Cart and orders cascade-delete with the user (see the FK onDelete:
 * Cascade added in the add_guest_accounts migration).
 */
export const cleanupExpiredGuests = async (): Promise<void> => {
  try {
    const { count } = await prisma.user.deleteMany({
      where: { isGuest: true, expiresAt: { lt: new Date() } },
    });
    if (count > 0) {
      console.log(`🧹 Cleaned up ${count} expired guest account(s)`);
    }
  } catch (error) {
    console.error('⚠️ Guest cleanup failed:', error);
  }
};

const CLEANUP_INTERVAL_MS = 60 * 60 * 1000; // hourly

/** Starts the recurring cleanup, running once immediately on boot. */
export const startGuestCleanupJob = (): void => {
  void cleanupExpiredGuests();
  setInterval(() => void cleanupExpiredGuests(), CLEANUP_INTERVAL_MS);
};
