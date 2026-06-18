import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';

interface StatCard {
  label: string;
  value: string | number;
  trend?: string;
  icon: string;
  accent?: boolean;
}

interface RecentPost {
  title: string;
  community: string;
  communityColor: string;
  timeAgo: string;
  likes: number;
  comments: number;
}

interface ActiveThread {
  title: string;
  community: string;
  replies: number;
  tag: string;
  urgent: boolean;
}

@Component({
  selector: 'lc-professional-dashboard',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './professional-dashboard.component.html',
  styleUrl: './professional-dashboard.component.scss',
})
export class ProfessionalDashboardComponent {
  private readonly auth = inject(AuthService);

  get displayName(): string { return this.auth.user()?.name ?? 'Doctor'; }

  readonly stats: StatCard[] = [
    { icon: '💬', label: 'Posts this month',    value: 14,      trend: '+4 vs last month' },
    { icon: '🤝', label: 'Communities active',  value: 3 },
    { icon: '❤️', label: 'Likes received',      value: 312,     trend: '+47 this week' },
    { icon: '🔔', label: 'Unanswered mentions', value: 5,       accent: true },
  ];

  readonly recentPosts: RecentPost[] = [
    {
      title: 'Managing Metformin GI side effects — practical tips from clinic',
      community: 'Diabetes Support',
      communityColor: '#D97706',
      timeAgo: '2 hours ago',
      likes: 38,
      comments: 12,
    },
    {
      title: 'Why home blood pressure readings matter as much as clinic readings',
      community: 'Hypertension Hub',
      communityColor: '#7C3AED',
      timeAgo: '1 day ago',
      likes: 71,
      comments: 24,
    },
    {
      title: 'HbA1c targets — what the numbers actually mean for daily life',
      community: 'Diabetes Support',
      communityColor: '#D97706',
      timeAgo: '3 days ago',
      likes: 95,
      comments: 41,
    },
    {
      title: 'Statins and muscle pain: separating myth from risk',
      community: 'Heart Health',
      communityColor: '#DC2626',
      timeAgo: '5 days ago',
      likes: 58,
      comments: 19,
    },
  ];

  readonly activeThreads: ActiveThread[] = [
    {
      title: 'Is it safe to take ibuprofen with lisinopril long term?',
      community: 'Hypertension Hub',
      replies: 6,
      tag: 'Drug interaction',
      urgent: true,
    },
    {
      title: 'My cardiologist recommended I stop Atorvastatin — second opinion?',
      community: 'Heart Health',
      replies: 3,
      tag: 'Cardiology',
      urgent: true,
    },
    {
      title: 'What foods spike blood sugar the most unexpectedly?',
      community: 'Diabetes Support',
      replies: 22,
      tag: 'Nutrition',
      urgent: false,
    },
    {
      title: 'How long before Amlodipine starts working for most people?',
      community: 'Hypertension Hub',
      replies: 11,
      tag: 'Medication',
      urgent: false,
    },
    {
      title: 'Managing fatigue with heart failure — tips that actually help',
      community: 'Heart Health',
      replies: 17,
      tag: 'Symptom management',
      urgent: false,
    },
  ];
}
