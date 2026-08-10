import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

import { CommunityGroupsService } from '../../core/community/community-groups.service';
import { CommunityPostsService } from '../../core/community/community-posts.service';
import { CommunityStats } from '../../core/community/community.models';
import { CommunityNavService } from './community-nav.service';
import { GuidelinesModalComponent } from './guidelines-modal/guidelines-modal.component';

@Component({
  selector: 'lc-community-portal',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, RouterOutlet, GuidelinesModalComponent],
  templateUrl: './community-portal.component.html',
  styleUrl: './community-portal.component.scss',
})
export class CommunityPortalComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly groups$ = inject(CommunityGroupsService);
  private readonly posts$ = inject(CommunityPostsService);
  readonly nav = inject(CommunityNavService);

  readonly showGuidelines = signal(false);
  readonly statsFailed = signal(false);

  private readonly stats = signal<CommunityStats | null>(null);

  /**
   * The caller's own four numbers.
   *
   * These used to render `GET /community/overview` — platform-wide counters, so every
   * user of every role saw the same Members / Posts this week / Active discussions /
   * Communities, none of which said anything about them. The same four tiles are shown
   * to all three participant roles deliberately: they are one `getStats` call with no
   * role branching, and the role-specific numbers already live on the dashboards.
   */
  readonly tiles = computed(() => {
    const s = this.stats();
    // Em-dashes while loading rather than a spinner: the shell must never block the
    // router-outlet below it.
    const v = (n?: number) => (s ? String(n ?? 0) : '—');
    return [
      { icon: '👥', value: v(s?.communitiesJoined), label: 'Communities joined' },
      { icon: '📝', value: v(s?.postsWritten), label: 'Posts written' },
      { icon: '💬', value: v(s?.repliesReceived), label: 'Replies received' },
      { icon: '❤️', value: v(s?.helpfulMarks), label: 'Helpful marks' },
    ];
  });

  constructor() {
    // Read once here and shared through the service: Angular's default
    // paramsInheritanceStrategy means children do not inherit `data` through a
    // path-ful parent, so each child reading route.data would get nothing.
    this.nav.setBase(this.route.snapshot.data['communityBase'] as string | undefined);
  }

  ngOnInit(): void {
    // Groups still load here: the feed's filter chips and the new-post modal both read
    // them, and both live under this shell.
    this.groups$.loadGroups().subscribe({ error: () => undefined });
    this.posts$.loadStats().subscribe({
      next: s => this.stats.set(s),
      error: () => this.statsFailed.set(true),
    });
  }
}
