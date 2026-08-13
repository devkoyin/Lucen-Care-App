import { Component, computed, inject, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';

import { CommunityPost, timeAgo } from '../../../core/community/community.models';
import { CommunityNavService } from '../community-nav.service';

/**
 * One post, rendered identically wherever it appears.
 *
 * The feed and the group page previously each carried their own copy of this markup
 * and about a hundred duplicated lines of SCSS, which is how they came to disagree:
 * the group page stamped every new post as "You" while the feed used the signed-in
 * user's name and badge.
 */
@Component({
  selector: 'lc-post-card',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './post-card.component.html',
  styleUrl: './post-card.component.scss',
})
export class PostCardComponent {
  private readonly nav = inject(CommunityNavService);

  readonly post = input.required<CommunityPost>();
  /** Off on the group page, where naming the community on every card is noise. */
  readonly showCommunityBadge = input(true);
  readonly reactionPending = input(false);

  readonly react = output<CommunityPost>();
  readonly report = output<CommunityPost>();

  readonly when = computed(() => timeAgo(this.post().createdAt));

  readonly threadLink = computed(() => this.nav.link('post', this.post().id));
  readonly communityLink = computed(() => this.nav.link('group', this.post().communityId));

  readonly proTitle = computed(() => {
    const s = this.post().author.specialty;
    return s ? `Verified Health Professional · ${s}` : 'Verified Health Professional';
  });
}
