import { HttpParams } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';

import { ApiService } from '../api/api.service';
import { WrappedResponse } from '../api/wrapped-response.model';

/** The coarse grouping the API assigns each notification type. */
export type NotificationCategory = 'application' | 'program' | 'care' | 'system';

/**
 * One notification as GET /notifications/me returns it.
 *
 * `title` and `body` are rendered server-side from the stored payload, so every
 * client shows identical wording. `payload` travels raw purely so a client can build
 * its own deep link — read ids from it, not copy.
 */
export interface AppNotification {
  id: string;
  type: string;
  category: NotificationCategory;
  title: string;
  body: string;
  payload: Record<string, unknown>;
  read: boolean;
  readAt?: string;
  createdAt: string;
}

interface NotificationListData {
  notifications: AppNotification[];
  nextCursor?: string;
  unreadCount: number;
}

@Injectable({ providedIn: 'root' })
export class NotificationsService {
  private readonly api = inject(ApiService);

  private readonly _notifications = signal<AppNotification[]>([]);
  private readonly _unreadCount = signal(0);
  private readonly _nextCursor = signal<string | undefined>(undefined);

  readonly notifications = this._notifications.asReadonly();
  /** From the server, so it counts everything unread — not just the loaded page. */
  readonly unreadCount = this._unreadCount.asReadonly();
  readonly hasMore = computed(() => this._nextCursor() !== undefined);

  load(limit = 30): Observable<AppNotification[]> {
    return this.api
      .get<WrappedResponse<NotificationListData>>(
        '/notifications/me',
        new HttpParams().set('limit', limit),
      )
      .pipe(
        map(r => r.data),
        tap(data => {
          this._notifications.set(data.notifications);
          this._unreadCount.set(data.unreadCount);
          this._nextCursor.set(data.nextCursor);
        }),
        map(data => data.notifications),
      );
  }

  loadMore(limit = 30): Observable<AppNotification[]> {
    const cursor = this._nextCursor();
    if (!cursor) return this.load(limit);

    return this.api
      .get<WrappedResponse<NotificationListData>>(
        '/notifications/me',
        new HttpParams().set('limit', limit).set('cursor', cursor),
      )
      .pipe(
        map(r => r.data),
        tap(data => {
          this._notifications.update(list => [...list, ...data.notifications]);
          this._unreadCount.set(data.unreadCount);
          this._nextCursor.set(data.nextCursor);
        }),
        map(data => data.notifications),
      );
  }

  markRead(id: string): Observable<AppNotification> {
    return this.api
      .patch<WrappedResponse<AppNotification>>(`/notifications/${id}/read`, {})
      .pipe(
        map(r => r.data),
        tap(updated => {
          this._notifications.update(list =>
            list.map(n => (n.id === updated.id ? updated : n)),
          );
          this._unreadCount.update(c => Math.max(0, c - 1));
        }),
      );
  }

  markAllRead(): Observable<{ updated: number }> {
    return this.api
      .patch<WrappedResponse<{ updated: number }>>('/notifications/read-all', {})
      .pipe(
        map(r => r.data),
        tap(() => {
          const now = new Date().toISOString();
          this._notifications.update(list =>
            list.map(n => (n.read ? n : { ...n, read: true, readAt: now })),
          );
          this._unreadCount.set(0);
        }),
      );
  }
}

const CATEGORY_LABELS: Record<NotificationCategory, string> = {
  application: 'Applications',
  program: 'Programmes',
  care: 'Care',
  system: 'System',
};

export function categoryLabel(category: NotificationCategory): string {
  return CATEGORY_LABELS[category] ?? category;
}

const CATEGORY_ICONS: Record<NotificationCategory, string> = {
  application: '👤',
  program: '📋',
  care: '💊',
  system: '⚙️',
};

export function categoryIcon(category: NotificationCategory): string {
  return CATEGORY_ICONS[category] ?? '🔔';
}

const CATEGORY_COLORS: Record<NotificationCategory, string> = {
  application: '#059669',
  program: '#2563EB',
  care: '#D97706',
  system: '#6B7280',
};

export function categoryColor(category: NotificationCategory): string {
  return CATEGORY_COLORS[category] ?? '#6B7280';
}
