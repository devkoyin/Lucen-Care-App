import { Component, computed, signal } from '@angular/core';

type NotifType = 'application' | 'program' | 'budget' | 'system';

interface Notification {
  id: string;
  type: NotifType;
  title: string;
  body: string;
  timestamp: string;
  read: boolean;
  actionLabel?: string;
}

const SEED: Notification[] = [
  { id: 'N-001', type: 'application', title: 'New application — Fatima Yusuf', body: 'Fatima Yusuf submitted an application for the Chronic Care Fund (Type 2 Diabetes). Income verification pending.', timestamp: '3 Jun 2026, 9:14 AM', read: false, actionLabel: 'Review' },
  { id: 'N-002', type: 'application', title: 'New application — Kwame Asante', body: 'Kwame Asante applied to the Sickle Cell Support Fund. HbSS genotype confirmation attached.', timestamp: '31 May 2026, 2:48 PM', read: false, actionLabel: 'Review' },
  { id: 'N-003', type: 'program',     title: 'Cardiac Support Program nearing capacity', body: '22 of 25 slots are now filled. Only 3 slots remaining. Deadline: 30 Jun 2026.', timestamp: '30 May 2026, 10:05 AM', read: false },
  { id: 'N-004', type: 'budget',      title: 'Cardiac Support Program — 90% budget utilised', body: '₦10.8M of ₦12M disbursed to date. At current rate, budget may be exhausted before deadline.', timestamp: '28 May 2026, 4:20 PM', read: true },
  { id: 'N-005', type: 'application', title: 'Application selected — Musa Ibrahim', body: 'Musa Ibrahim has been selected for the Cardiac Support Program. Onboarding details have been sent to his coordinator.', timestamp: '25 May 2026, 11:30 AM', read: true },
  { id: 'N-006', type: 'application', title: 'Application rejected — Blessing Nwachukwu', body: 'Blessing Nwachukwu\'s application for the Chronic Care Fund was rejected: household income above eligibility threshold.', timestamp: '20 May 2026, 3:15 PM', read: true },
  { id: 'N-007', type: 'program',     title: 'Child Nutrition Fund is now Full', body: 'All 15 slots for the Child Nutrition Fund have been filled. New applications will be automatically waitlisted.', timestamp: '18 May 2026, 8:00 AM', read: true },
  { id: 'N-008', type: 'system',      title: 'Monthly disbursement report ready', body: 'The May 2026 disbursement report has been generated. Total: ₦4.2M across 6 active programs.', timestamp: '1 May 2026, 7:00 AM', read: true, actionLabel: 'View Report' },
  { id: 'N-009', type: 'budget',      title: 'Budget renewal — Respiratory Aid Initiative', body: 'GlaxoSmithKline Nigeria CSR has confirmed continued funding for the Respiratory Aid Initiative through Dec 2026.', timestamp: '15 Apr 2026, 2:00 PM', read: true },
  { id: 'N-010', type: 'system',      title: 'Maternal Health Initiative launched', body: 'The Maternal Health Initiative is now live with 30 available slots. Funded by USAID Nigeria. Coordinator: Mrs. Bisi Lawal.', timestamp: '1 Apr 2026, 9:00 AM', read: true },
];

type TypeFilter = 'all' | NotifType;

@Component({
  selector: 'lc-notifications',
  standalone: true,
  imports: [],
  templateUrl: './notifications.component.html',
  styleUrl: './notifications.component.scss',
})
export class NotificationsComponent {
  readonly notifications = signal<Notification[]>(SEED);
  readonly typeFilter = signal<TypeFilter>('all');

  readonly tabs: { label: string; key: TypeFilter }[] = [
    { label: 'All',          key: 'all'         },
    { label: 'Applications', key: 'application' },
    { label: 'Programs',     key: 'program'     },
    { label: 'Budget',       key: 'budget'      },
    { label: 'System',       key: 'system'      },
  ];

  readonly filtered = computed(() => {
    const f = this.typeFilter();
    return f === 'all' ? this.notifications() : this.notifications().filter(n => n.type === f);
  });

  readonly unreadCount = computed(() =>
    this.notifications().filter(n => !n.read).length
  );

  setFilter(f: TypeFilter): void { this.typeFilter.set(f); }

  markRead(id: string): void {
    this.notifications.update(list =>
      list.map(n => n.id === id ? { ...n, read: true } : n)
    );
  }

  markAllRead(): void {
    this.notifications.update(list => list.map(n => ({ ...n, read: true })));
  }

  typeIcon(t: NotifType): string {
    const map: Record<NotifType, string> = {
      application: '👤',
      program:     '📋',
      budget:      '💰',
      system:      '⚙️',
    };
    return map[t];
  }

  typeColor(t: NotifType): string {
    const map: Record<NotifType, string> = {
      application: '#059669',
      program:     '#2563EB',
      budget:      '#D97706',
      system:      '#6B7280',
    };
    return map[t];
  }
}
