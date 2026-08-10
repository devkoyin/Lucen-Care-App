import { Component, computed, effect, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';

import { apiErrorMessage } from '../../../core/api/wrapped-response.model';
import { CommunityGroupsService } from '../../../core/community/community-groups.service';
import { CommunityPostsService } from '../../../core/community/community-posts.service';
import { CommunityGroup, CommunityPost } from '../../../core/community/community.models';
import { CommunityNavService } from '../community-nav.service';
import { NewPostData, NewPostModalComponent } from '../new-post-modal.component';
import { PostCardComponent } from '../post-card/post-card.component';
import { ReportModalComponent, ReportSubmission } from '../report-modal.component';

@Component({
  selector: 'lc-community-group',
  standalone: true,
  imports: [RouterLink, NewPostModalComponent, PostCardComponent, ReportModalComponent],
  templateUrl: './community-group.component.html',
  styleUrl: './community-group.component.scss',
})
export class CommunityGroupComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly groups$ = inject(CommunityGroupsService);
  readonly posts$ = inject(CommunityPostsService);
  readonly nav = inject(CommunityNavService);

  // toSignal over paramMap, not route.snapshot in a field initialiser: with the
  // snapshot, navigating from one group's card to another never refetched.
  private readonly params = toSignal(this.route.paramMap);
  readonly groupId = computed(() => this.params()?.get('id') ?? '');

  readonly group = signal<CommunityGroup | null>(null);
  readonly posts = this.posts$.posts;
  readonly hasMore = this.posts$.hasMore;

  readonly loading = signal(true);
  readonly notFound = signal(false);
  readonly loadingMore = signal(false);
  readonly actionError = signal<string | null>(null);
  readonly joinBusy = signal(false);

  readonly showNewPost = signal(false);
  readonly posting = signal(false);
  readonly postError = signal<string | null>(null);

  readonly reportTarget = signal<CommunityPost | null>(null);
  readonly reporting = signal(false);
  readonly reportError = signal<string | null>(null);
  readonly reportDone = signal(false);

  readonly accent = computed(() => this.group()?.accent || '#0EA589');

  constructor() {
    effect(() => {
      const id = this.groupId();
      if (id) this.load(id);
    });
  }

  private load(id: string): void {
    this.loading.set(true);
    this.notFound.set(false);

    // A real 404 from the API, rather than "not in the six seed rows" — which is
    // why a user-created group used to render "Group not found".
    this.groups$.get(id).subscribe({
      next: g => {
        this.group.set(g);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.notFound.set(true);
      },
    });

    this.posts$.loadFeed({ communityId: id }).subscribe({ error: () => {} });
  }

  reload(): void {
    if (this.groupId()) this.load(this.groupId());
  }

  loadMore(): void {
    this.loadingMore.set(true);
    this.posts$.loadMore().subscribe({
      next: () => this.loadingMore.set(false),
      error: () => this.loadingMore.set(false),
    });
  }

  toggleJoin(): void {
    const g = this.group();
    if (!g) return;

    this.joinBusy.set(true);
    this.actionError.set(null);
    const req = g.joined ? this.groups$.leave(g.id) : this.groups$.join(g.id);
    req.subscribe({
      next: r => {
        this.group.set({ ...g, joined: r.joined, memberCount: r.memberCount });
        this.joinBusy.set(false);
      },
      error: err => {
        this.joinBusy.set(false);
        this.actionError.set(apiErrorMessage(err));
      },
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

  // No hardcoded author here any more. This component used to stamp every post
  // "You" while the feed used the signed-in user's real name and badge — the same
  // person got two identities depending on where they posted from.
  addPost(data: NewPostData): void {
    this.posting.set(true);
    this.postError.set(null);
    this.posts$.create(data.communityId, { title: data.title, body: data.body, tags: data.tags }).subscribe({
      next: () => {
        this.posting.set(false);
        this.showNewPost.set(false);
      },
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
