import { Component, computed, effect, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';

import { apiErrorMessage } from '../../../core/api/wrapped-response.model';
import { CommunityPostsService } from '../../../core/community/community-posts.service';
import { CommunityComment, CommunityPost, timeAgo } from '../../../core/community/community.models';
import { CommunityNavService } from '../community-nav.service';
import { PostCardComponent } from '../post-card/post-card.component';
import { ReportModalComponent, ReportSubmission } from '../report-modal.component';

/** One top-level comment plus its replies, so the template renders two levels. */
export interface CommentThreadNode {
  comment: CommunityComment;
  replies: CommunityComment[];
}

/**
 * The thread behind a post.
 *
 * A real route rather than a modal or an inline expansion: four surfaces outside
 * this feature need to link into a thread — the professional's Answer button, both
 * dashboards' My Posts, the benefactor's View Thread and reply notifications — and
 * only a URL crosses that boundary. Every one of those was a dead button before.
 */
@Component({
  selector: 'lc-post-detail',
  standalone: true,
  imports: [RouterLink, PostCardComponent, ReportModalComponent],
  templateUrl: './post-detail.component.html',
  styleUrl: './post-detail.component.scss',
})
export class PostDetailComponent {
  private readonly route = inject(ActivatedRoute);
  readonly posts$ = inject(CommunityPostsService);
  readonly nav = inject(CommunityNavService);

  private readonly params = toSignal(this.route.paramMap);
  readonly postId = computed(() => this.params()?.get('id') ?? '');

  readonly post = this.posts$.post;
  readonly hasMoreComments = this.posts$.hasMoreComments;

  readonly loading = signal(true);
  readonly notFound = signal(false);
  readonly loadingMore = signal(false);
  readonly actionError = signal<string | null>(null);

  readonly draft = signal('');
  readonly replyingTo = signal<CommunityComment | null>(null);
  readonly sending = signal(false);
  readonly composerError = signal<string | null>(null);

  readonly reportComment = signal<CommunityComment | null>(null);
  readonly reportPost = signal<CommunityPost | null>(null);
  readonly reporting = signal(false);
  readonly reportError = signal<string | null>(null);
  readonly reportDone = signal(false);

  /** Nesting is one level. The server enforces it; this just renders it. */
  readonly thread = computed<CommentThreadNode[]>(() => {
    const all = this.posts$.comments();
    const tops = all.filter(c => !c.parentCommentId);
    return tops.map(comment => ({
      comment,
      replies: all.filter(c => c.parentCommentId === comment.id),
    }));
  });

  readonly reportTargetType = computed<'post' | 'comment'>(() =>
    this.reportComment() ? 'comment' : 'post',
  );

  constructor() {
    effect(() => {
      const id = this.postId();
      if (id) this.load(id);
    });
  }

  private load(id: string): void {
    this.loading.set(true);
    this.notFound.set(false);

    this.posts$.loadPost(id).subscribe({
      next: () => this.loading.set(false),
      // The API returns 404 rather than 403 for a post a moderator has hidden, so
      // this branch covers both "gone" and "removed and not yours".
      error: () => {
        this.loading.set(false);
        this.notFound.set(true);
      },
    });

    this.posts$.loadComments(id).subscribe({ error: () => {} });
  }

  reload(): void {
    if (this.postId()) this.load(this.postId());
  }

  when(iso: string): string {
    return timeAgo(iso);
  }

  loadMoreComments(): void {
    this.loadingMore.set(true);
    this.posts$.loadMoreComments(this.postId()).subscribe({
      next: () => this.loadingMore.set(false),
      error: () => this.loadingMore.set(false),
    });
  }

  isPending(id: string): boolean {
    return this.posts$.isPending(id);
  }

  reactToPost(post: CommunityPost): void {
    this.actionError.set(null);
    this.posts$.toggleReaction(post).subscribe({
      error: err => this.actionError.set(apiErrorMessage(err)),
    });
  }

  reactToComment(comment: CommunityComment): void {
    this.actionError.set(null);
    this.posts$.toggleCommentReaction(comment).subscribe({
      error: err => this.actionError.set(apiErrorMessage(err)),
    });
  }

  startReply(comment: CommunityComment): void {
    this.replyingTo.set(comment);
  }

  cancelReply(): void {
    this.replyingTo.set(null);
  }

  send(): void {
    const body = this.draft().trim();
    if (!body || this.sending()) return;

    this.sending.set(true);
    this.composerError.set(null);
    this.posts$.addComment(this.postId(), body, this.replyingTo()?.id).subscribe({
      next: () => {
        this.sending.set(false);
        this.draft.set('');
        this.replyingTo.set(null);
      },
      error: err => {
        this.sending.set(false);
        this.composerError.set(apiErrorMessage(err));
      },
    });
  }

  openPostReport(post: CommunityPost): void {
    this.reportComment.set(null);
    this.reportPost.set(post);
    this.reportDone.set(false);
    this.reportError.set(null);
  }

  openCommentReport(comment: CommunityComment): void {
    this.reportPost.set(null);
    this.reportComment.set(comment);
    this.reportDone.set(false);
    this.reportError.set(null);
  }

  submitReport(submission: ReportSubmission): void {
    const comment = this.reportComment();
    const post = this.reportPost();
    const target = comment ? ('comment' as const) : ('post' as const);
    const id = comment?.id ?? post?.id;
    if (!id) return;

    this.reporting.set(true);
    this.reportError.set(null);
    this.posts$.report(target, id, submission.reason, submission.details).subscribe({
      next: () => {
        this.reporting.set(false);
        this.reportDone.set(true);
      },
      error: err => {
        this.reporting.set(false);
        // Already reported — their intent was satisfied, so it reads as success.
        if ((err as { status?: number })?.status === 409) {
          this.reportDone.set(true);
          return;
        }
        this.reportError.set(apiErrorMessage(err));
      },
    });
  }

  closeReport(): void {
    this.reportComment.set(null);
    this.reportPost.set(null);
    this.reportDone.set(false);
  }
}
