import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

import { CommunityGroupsService } from '../../core/community/community-groups.service';
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
  readonly nav = inject(CommunityNavService);

  readonly showGuidelines = signal(false);
  readonly statsFailed = signal(false);

  private readonly overview = this.groups$.overview;

  readonly tiles = computed(() => {
    const o = this.overview();
    // Em-dashes while loading rather than a spinner: the shell must never block the
    // router-outlet below it.
    const v = (n?: number) => (o ? String(n ?? 0) : '—');
    return [
      { icon: '🤝', value: v(o?.memberCount), label: 'Members' },
      { icon: '📝', value: v(o?.postsThisWeek), label: 'Posts this week' },
      { icon: '💬', value: v(o?.activeDiscussions), label: 'Active discussions' },
      { icon: '👥', value: v(o?.communityCount), label: 'Communities' },
    ];
  });

  constructor() {
    // Read once here and shared through the service: Angular's default
    // paramsInheritanceStrategy means children do not inherit `data` through a
    // path-ful parent, so each child reading route.data would get nothing.
    this.nav.setBase(this.route.snapshot.data['communityBase'] as string | undefined);
  }

  ngOnInit(): void {
    this.groups$.loadAll().subscribe({ error: () => this.statsFailed.set(true) });
  }
}
