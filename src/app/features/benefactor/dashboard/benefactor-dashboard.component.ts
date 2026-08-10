import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

import { AuthService } from '../../../core/auth/auth.service';
import { CommunityPostsService } from '../../../core/community/community-posts.service';
import { CommunityStats } from '../../../core/community/community.models';

interface StatTile {
  icon: string;
  value: number | string;
  label: string;
}

/**
 * Four real numbers, from GET /community/stats.
 *
 * The strip this replaces led with "₦495,000 total contributed" — a financial
 * figure shown to a real benefactor with no payments or donations module anywhere
 * in the platform to produce it. "Patients reached" and "Programmes supported" had
 * the same problem: nothing links a benefactor to a patient or a programme.
 * "Communities joined" survives because it is now a genuine membership count.
 */
@Component({
  selector: 'lc-benefactor-dashboard',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './benefactor-dashboard.component.html',
  styleUrl: './benefactor-dashboard.component.scss',
})
export class BenefactorDashboardComponent implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly posts$ = inject(CommunityPostsService);

  private readonly communityStats = signal<CommunityStats | null>(null);

  get displayName(): string { return this.auth.user()?.name ?? 'Friend'; }

  readonly stats = computed<StatTile[]>(() => {
    const s = this.communityStats();
    const v = (n?: number) => (s ? (n ?? 0) : '—');
    return [
      { icon: '🤝', value: v(s?.communitiesJoined), label: 'Communities joined' },
      { icon: '📝', value: v(s?.postsThisMonth), label: 'Posts this month' },
      { icon: '❤️', value: v(s?.helpfulMarks), label: 'Helpful marks' },
      { icon: '💬', value: v(s?.questionsAnswered), label: 'Replies written' },
    ];
  });

  ngOnInit(): void {
    this.posts$.loadStats().subscribe({
      next: s => this.communityStats.set(s),
      error: () => {},
    });
  }
}
