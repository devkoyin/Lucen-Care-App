import { Component, computed, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';

import { CommunityPost, timeAgo } from '../../../core/community/community.models';
import { CommunityNavService } from '../community-nav.service';

/**
 * A compact list of posts for the professional and benefactor dashboards.
 *
 * All four of those tabs — Patient Threads, My Posts on each side — rendered the
 * same card over their own seed constant, each with a dead "Answer" / "View Post"
 * button. One component, one link that actually goes somewhere.
 */
@Component({
  selector: 'lc-post-summary-list',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './post-summary-list.component.html',
  styleUrl: './post-summary-list.component.scss',
})
export class PostSummaryListComponent {
  readonly posts = input.required<CommunityPost[]>();
  readonly loading = input(false);
  readonly loadError = input(false);
  readonly emptyText = input('Nothing here yet.');
  /** "Answer" on the professional's queue, "View thread" everywhere else. */
  readonly actionLabel = input('View thread');
  /** Shown on the author's own posts so a moderator removal is not silent. */
  readonly showRemoved = input(false);

  private readonly nav = inject(CommunityNavService);

  readonly rows = computed(() =>
    this.posts().map(p => ({
      post: p,
      when: timeAgo(p.createdAt),
      link: this.nav.link('post', p.id),
    })),
  );
}
