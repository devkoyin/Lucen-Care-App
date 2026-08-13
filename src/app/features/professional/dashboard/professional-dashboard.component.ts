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
 * The strip this replaces showed "2,400+ patients reached", "3.2 hrs average
 * response time" and a "96% helpful rating" — all hardcoded in a seed file, none of
 * them derivable from anything the platform stores. "Questions answered" survives
 * because it is a genuine count of this professional's replies, and "Helpful marks"
 * replaces the rating with the count that actually exists: a percentage needs a
 * denominator nobody records.
 */
@Component({
  selector: 'lc-professional-dashboard',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './professional-dashboard.component.html',
  styleUrl: './professional-dashboard.component.scss',
})
export class ProfessionalDashboardComponent implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly posts$ = inject(CommunityPostsService);

  private readonly communityStats = signal<CommunityStats | null>(null);

  get displayName(): string { return this.auth.user()?.name ?? 'Doctor'; }

  readonly stats = computed<StatTile[]>(() => {
    const s = this.communityStats();
    // An em-dash while loading or on failure, rather than a zero that reads as a
    // measured result.
    const v = (n?: number) => (s ? (n ?? 0) : '—');
    return [
      { icon: '✅', value: v(s?.questionsAnswered), label: 'Questions answered' },
      { icon: '❤️', value: v(s?.helpfulMarks), label: 'Helpful marks' },
      { icon: '📝', value: v(s?.postsThisMonth), label: 'Posts this month' },
      { icon: '🤝', value: v(s?.communitiesJoined), label: 'Communities joined' },
    ];
  });

  ngOnInit(): void {
    this.posts$.loadStats().subscribe({
      next: s => this.communityStats.set(s),
      error: () => {},
    });
  }
}
