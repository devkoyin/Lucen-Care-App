import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';

interface StatCard {
  icon: string;
  label: string;
  value: string | number;
  trend?: string;
  accent?: boolean;
}

interface ActiveThread {
  title: string;
  community: string;
  communityColor: string;
  replies: number;
  timeAgo: string;
}

@Component({
  selector: 'lc-benefactor-dashboard',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './benefactor-dashboard.component.html',
  styleUrl: './benefactor-dashboard.component.scss',
})
export class BenefactorDashboardComponent {
  private readonly auth = inject(AuthService);

  get displayName(): string { return this.auth.user()?.name ?? 'Benefactor'; }

  readonly stats: StatCard[] = [
    { icon: '🤝', label: 'Communities joined',   value: 3 },
    { icon: '💬', label: 'Posts this month',      value: 8,    trend: '+3 vs last month' },
    { icon: '❤️', label: 'Likes received',        value: 94,   trend: '+12 this week' },
    { icon: '🔔', label: 'Unread replies',        value: 4,    accent: true },
  ];

  readonly recentThreads: ActiveThread[] = [
    {
      title: 'How to support someone managing Type 2 Diabetes day-to-day',
      community: 'Diabetes Support',
      communityColor: '#D97706',
      replies: 14,
      timeAgo: '1 hour ago',
    },
    {
      title: 'Resources for caregivers of hypertension patients',
      community: 'Hypertension Hub',
      communityColor: '#7C3AED',
      replies: 9,
      timeAgo: '3 hours ago',
    },
    {
      title: 'Managing medication costs — what support is available?',
      community: 'General Wellness',
      communityColor: '#059669',
      replies: 21,
      timeAgo: '1 day ago',
    },
    {
      title: 'Encouraging a loved one to track their blood pressure consistently',
      community: 'Heart Health',
      communityColor: '#DC2626',
      replies: 6,
      timeAgo: '2 days ago',
    },
  ];

  readonly impactHighlights = [
    { icon: '🏘️', text: '3 active patient communities you\'re part of' },
    { icon: '👥', text: '5,400+ members benefiting from community support' },
    { icon: '💛', text: 'Your Verified Benefactor badge encourages others to give' },
  ];
}
