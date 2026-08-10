import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';

import { apiErrorMessage } from '../../core/api/wrapped-response.model';
import { CommunityGroupsService } from '../../core/community/community-groups.service';
import { CommunityPostsService } from '../../core/community/community-posts.service';
import { CommunityPost } from '../../core/community/community.models';
import { AuthService } from '../../core/auth/auth.service';
import { CommunityNavService } from './community-nav.service';
import { NewPostData, NewPostModalComponent } from './new-post-modal.component';
import { PostCardComponent } from './post-card/post-card.component';
import { ReportModalComponent, ReportSubmission } from './report-modal.component';

@Component({
  selector: 'lc-community',
  standalone: true,
  imports: [NewPostModalComponent, PostCardComponent, ReportModalComponent, RouterLink],
  templateUrl: './community.component.html',
  styleUrl: './community.component.scss',
})
export class CommunityComponent implements OnInit {
  // AuthService is used only to decide whether to offer "create a community" —
  // that is patients-only. The author-badge derivation that used to live here has
  // moved server-side, where a verification claim can actually be vouched for.
  private readonly auth = inject(AuthService);
  private readonly route = inject(ActivatedRoute);
  readonly posts$ = inject(CommunityPostsService);
  readonly groups$ = inject(CommunityGroupsService);
  readonly nav = inject(CommunityNavService);

  readonly posts = this.posts$.posts;
  readonly hasMore = this.posts$.hasMore;

  readonly loading = signal(true);
  readonly loadingMore = signal(false);
  readonly loadError = signal(false);
  readonly actionError = signal<string | null>(null);

  readonly showNewPost = signal(false);
  readonly posting = signal(false);
  readonly postError = signal<string | null>(null);

  readonly reportTarget = signal<CommunityPost | null>(null);
  readonly reporting = signal(false);
  readonly reportError = signal<string | null>(null);
  readonly reportDone = signal(false);

  readonly activeFilter = signal<string | null>(null);

  /** A tag deep-link from the Trending tab, so that list is no longer a dead end. */
  private readonly queryParams = toSignal(this.route.queryParamMap);
  readonly activeTag = computed(() => this.queryParams()?.get('tag') ?? null);

  readonly isPatient = computed(() => this.auth.role() === 'patient');

  /**
   * Whether ANY community exists, as distinct from whether the user has joined one.
   * "Join a community" is useless advice when there are none to join.
   */
  readonly anyCommunityExists = computed(() => this.groups$.groups().length > 0);

  /**
   * Built from the groups this person has actually joined, matching what the feed
   * shows. Offering a chip for a community whose posts the default feed excludes
   * would make the chip look broken.
   */
  readonly filters = computed(() => {
    const joined = this.groups$.joinedGroups();
    return [
      { label: 'All', key: null as string | null },
      ...joined.slice(0, 8).map(g => ({ label: g.name, key: g.id })),
    ];
  });

  readonly joinedCount = computed(() => this.groups$.joinedGroups().length);

  /**
   * True when the feed is deliberately showing posts from outside the user's
   * communities — an explicit community filter, or a tag deep-link from Trending.
   */
  readonly browsingWidely = computed(() => this.activeFilter() !== null || this.activeTag() !== null);

  readonly postableGroups = computed(() => this.groups$.joinedGroups());

  ngOnInit(): void {
    this.groups$.load().subscribe({ error: () => {} });
    this.reload();
  }

  reload(): void {
    this.loading.set(true);
    this.loadError.set(false);
    const communityId = this.activeFilter() ?? undefined;
    const tag = this.activeTag() ?? undefined;

    // Server-side filtering. A client-side filter over a paginated list narrows one
    // page and presents it as the whole result.
    //
    // The default feed is the user's own communities — joining is what shapes it, and
    // a platform-wide default made the Groups tab decorative. An explicit filter opts
    // back out: browsing a community you have not joined must not come back empty, and
    // a #tag arriving from Trending (which is computed platform-wide) must not show a
    // fraction of the count that tag advertised.
    this.posts$
      .loadFeed({
        communityId,
        tag,
        joinedOnly: !communityId && !tag,
      })
      .subscribe({
        next: () => this.loading.set(false),
        error: () => {
          this.loading.set(false);
          this.loadError.set(true);
        },
      });
  }

  setFilter(key: string | null): void {
    this.activeFilter.set(key);
    this.reload();
  }

  loadMore(): void {
    this.loadingMore.set(true);
    this.posts$.loadMore().subscribe({
      next: () => this.loadingMore.set(false),
      error: () => this.loadingMore.set(false),
    });
  }

  isPending(post: CommunityPost): boolean {
    return this.posts$.isPending(post.id);
  }

  react(post: CommunityPost): void {
    this.actionError.set(null);
    this.posts$.toggleReaction(post).subscribe({
      error: err => this.actionError.set(apiErrorMessage(err)),
    });
  }

  addPost(data: NewPostData): void {
    this.posting.set(true);
    this.postError.set(null);
    this.posts$.create(data.communityId, { title: data.title, body: data.body, tags: data.tags }).subscribe({
      next: () => {
        this.posting.set(false);
        this.showNewPost.set(false);
      },
      // The modal stays open so a rejected post does not take the user's text with it.
      error: err => {
        this.posting.set(false);
        this.postError.set(apiErrorMessage(err));
      },
    });
  }

  openReport(post: CommunityPost): void {
    this.reportTarget.set(post);
    this.reportDone.set(false);
    this.reportError.set(null);
  }

  submitReport(submission: ReportSubmission): void {
    const target = this.reportTarget();
    if (!target) return;

    this.reporting.set(true);
    this.reportError.set(null);
    this.posts$.report('post', target.id, submission.reason, submission.details).subscribe({
      next: () => {
        this.reporting.set(false);
        this.reportDone.set(true);
      },
      error: err => {
        this.reporting.set(false);
        // 409 means they already reported it — their intent was satisfied, so this
        // is a success as far as the person pressing the button is concerned.
        if ((err as { status?: number })?.status === 409) {
          this.reportDone.set(true);
          return;
        }
        this.reportError.set(apiErrorMessage(err));
      },
    });
  }

  closeReport(): void {
    this.reportTarget.set(null);
    this.reportDone.set(false);
  }
}
