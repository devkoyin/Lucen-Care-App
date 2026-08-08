import { DatePipe } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';

import { apiErrorMessage } from '../../../core/api/wrapped-response.model';
import {
  AppNotification,
  NotificationCategory,
  NotificationsService,
  categoryColor,
  categoryIcon,
  categoryLabel,
} from '../../../core/notifications/notifications.service';

type CategoryFilter = 'all' | NotificationCategory;

@Component({
  selector: 'lc-notifications',
  standalone: true,
  imports: [DatePipe],
  templateUrl: './notifications.component.html',
  styleUrl: './notifications.component.scss',
})
export class NotificationsComponent implements OnInit {
  private readonly svc = inject(NotificationsService);
  private readonly router = inject(Router);

  readonly notifications = this.svc.notifications;
  readonly unreadCount = this.svc.unreadCount;
  readonly hasMore = this.svc.hasMore;

  readonly filter = signal<CategoryFilter>('all');
  readonly loading = signal(true);
  readonly loadingMore = signal(false);
  readonly loadError = signal(false);
  readonly actionError = signal<string | null>(null);

  /**
   * Tabs follow the data. An NGO never receives a `care` notification, so a fixed
   * tab row would leave one permanently empty.
   */
  readonly tabs = computed<{ label: string; key: CategoryFilter }[]>(() => {
    const present = new Set(this.notifications().map(n => n.category));
    const ordered: NotificationCategory[] = ['application', 'program', 'care', 'system'];
    return [
      { label: 'All', key: 'all' as CategoryFilter },
      ...ordered.filter(c => present.has(c)).map(c => ({ label: categoryLabel(c), key: c as CategoryFilter })),
    ];
  });

  readonly filtered = computed(() => {
    const f = this.filter();
    return f === 'all' ? this.notifications() : this.notifications().filter(n => n.category === f);
  });

  ngOnInit(): void {
    this.reload();
  }

  reload(): void {
    this.loading.set(true);
    this.svc.load().subscribe({
      next: () => {
        this.loadError.set(false);
        this.loading.set(false);
      },
      error: () => {
        this.loadError.set(true);
        this.loading.set(false);
      },
    });
  }

  loadMore(): void {
    if (this.loadingMore()) return;
    this.loadingMore.set(true);
    this.svc.loadMore().subscribe({
      next: () => this.loadingMore.set(false),
      error: (err: unknown) => {
        this.loadingMore.set(false);
        this.actionError.set(apiErrorMessage(err, 'Could not load older notifications.'));
      },
    });
  }

  setFilter(f: CategoryFilter): void {
    this.filter.set(f);
  }

  /** Opening a notification marks it read and, where there is one, follows its link. */
  open(n: AppNotification): void {
    if (!n.read) {
      this.svc.markRead(n.id).subscribe({
        error: (err: unknown) =>
          this.actionError.set(apiErrorMessage(err, 'Could not mark that as read.')),
      });
    }
    const link = this.linkFor(n);
    if (link) this.router.navigate(link.path, { queryParams: link.queryParams });
  }

  markAllRead(): void {
    this.svc.markAllRead().subscribe({
      error: (err: unknown) =>
        this.actionError.set(apiErrorMessage(err, 'Could not mark everything as read.')),
    });
  }

  actionLabel(n: AppNotification): string | null {
    return this.linkFor(n) ? 'Review' : null;
  }

  /**
   * Built here rather than server-side: the API returns ids, and only the client
   * knows its own routes.
   */
  private linkFor(
    n: AppNotification,
  ): { path: string[]; queryParams?: Record<string, string> } | null {
    const programId = n.payload?.['programId'];
    if (n.type === 'enrollment_application' && typeof programId === 'string') {
      return { path: ['/ngo/applicants'], queryParams: { programId } };
    }
    // An approval or rejection is only actionable on the programmes list — where
    // the reason is shown and Resubmit lives.
    if (n.type === 'program_reviewed') {
      return { path: ['/ngo/programs'] };
    }
    return null;
  }

  icon(category: NotificationCategory): string {
    return categoryIcon(category);
  }

  color(category: NotificationCategory): string {
    return categoryColor(category);
  }
}
