import { syncEngine } from '$lib/db';
import type { Notification } from '$lib/server/db/schema';

class NotificationsStore {
  private collection = { id: null };
  data = $state<Notification[]>([]);
  isLoading = $state(false);
  error = $state<Error | null>(null);

  get unread() {
    return this.data.filter(n => !n.read).sort((a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  get all() {
    return this.data.sort((a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  get unreadCount() {
    return this.unread.length;
  }

  async load() {
    if (!this.collection) return;

    this.isLoading = true;
    this.error = null;

    try {
      this.collection = syncEngine.collection('notifications');
      await this.collection.load();

      this.data = this.collection.data as Notification[];
    } catch (err) {
      this.error = err as Error;
      console.error('Failed to load notifications:', err);
    } finally {
      this.isLoading = false;
    }
  }

  async create(notification: Omit<Notification, 'id' | 'createdAt' | 'updatedAt'>) {
    if (!this.collection) return null;

    try {
      const newNotification = {
        ...notification,
        id: crypto.randomUUID(),
        createdAt: new Date(),
        updatedAt: new Date(),
        read: false
      };

      await this.collection.create(newNotification);
      // Optimistic update not strictly needed as syncEngine handles it,
      // but good for immediate feedback if not using reactive binding directly from engine
      this.data.push(newNotification);

      return newNotification;
    } catch (err) {
      this.error = err as Error;
      throw err;
    }
  }

  async markAsRead(id: string) {
    if (!this.collection) return;

    try {
      await this.collection.update(id, {
        read: true,
        updatedAt: new Date(),
      });

      this.data = this.data.map(n =>
        n.id === id ? { ...n, read: true, updatedAt: new Date() } : n
      );
    } catch (err) {
      this.error = err as Error;
      throw err;
    }
  }

  async markAllAsRead() {
    if (!this.collection) return;

    const unreadIds = this.unread.map(n => n.id);
    // Naive implementation: update one by one.
    // Ideally sync engine supports batch updates or we do it server side.
    // For now, let's just do a loop, it's fine for small numbers.
    try {
      await Promise.all(unreadIds.map(id => this.markAsRead(id)));
    } catch (err) {
      this.error = err as Error;
    }
  }

  async delete(id: string) {
    if (!this.collection) return;

    try {
      await this.collection.delete(id);
      this.data = this.data.filter(n => n.id !== id);
    } catch (err) {
      this.error = err as Error;
      throw err;
    }
  }
}

export const notificationsStore = new NotificationsStore();
