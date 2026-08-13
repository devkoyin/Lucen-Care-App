import { NgTemplateOutlet } from '@angular/common';
import { Component, computed, effect, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';

import { apiErrorMessage } from '../../../core/api/wrapped-response.model';
import { CommunityPostsService } from '../../../core/community/community-posts.service';
import { CommunityComment, CommunityPost, timeAgo } from '../../../core/community/community.models';
import { CommunityNavService } from '../community-nav.service';
import { PostCardComponent } from '../post-card/post-card.component';
import { ReportModalComponent, ReportSubmission } from '../report-modal.component';

/**
 * One top-level comment plus whatever replies have been fetched for it.
 *
 * `replies` is empty until the reader expands the node — the count on the toggle comes
 * from `comment.replyCount`, which the server computes, so a collapsed thread costs no
 * request at all.
 */
export interface CommentThreadNode {
  comment: CommunityComment;
  replies: CommunityComment[];
}

/** Which composer is open. `'root'` is the new-comment box at the foot of the thread. */
type ComposerTarget = 'root' | string | null;

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
  imports: [NgTemplateOutlet, RouterLink, PostCardComponent, ReportModalComponent],
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

  /**
   * Which composer is open, and the text in each.
   *
   * Drafts are keyed by target rather than held in one string so that opening a second
   * reply box never silently discards what was typed in the first. Only one box is open
   * at a time, but the text of the others survives until it is sent.
   */
  readonly openComposer = signal<ComposerTarget>(null);
  readonly drafts = signal<Record<string, string>>({});
  readonly sending = signal(false);
  readonly composerError = signal<string | null>(null);

  /** Which top-level comments the reader has expanded. */
  readonly expanded = signal<ReadonlySet<string>>(new Set());

  readonly reportComment = signal<CommunityComment | null>(null);
  readonly reportPost = signal<CommunityPost | null>(null);
  readonly reporting = signal(false);
  readonly reportError = signal<string | null>(null);
  readonly reportDone = signal(false);

  /**
   * Nesting is one level. The server enforces it; this just renders it.
   *
   * The top-level list and the replies are two separate stores, so this no longer has
   * to reconstruct the tree by scanning one flat array for matching parents — which
   * dropped any reply whose parent happened to fall on an earlier page.
   */
  readonly thread = computed<CommentThreadNode[]>(() => {
    const replies = this.posts$.replies();
    return this.posts$.comments().map(comment => ({
      comment,
      replies: replies[comment.id] ?? [],
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

  // ── Replies ──────────────────────────────────────────────────────────────

  isExpanded(commentId: string): boolean {
    return this.expanded().has(commentId);
  }

  isLoadingReplies(commentId: string): boolean {
    return this.posts$.isLoadingReplies(commentId);
  }

  hasMoreReplies(commentId: string): boolean {
    return this.posts$.hasMoreReplies(commentId);
  }

  /**
   * Expanding fetches once and then re-shows what is held — collapsing and reopening
   * must not re-hit the API.
   */
  toggleReplies(commentId: string): void {
    const open = this.isExpanded(commentId);
    this.expanded.update(set => {
      const next = new Set(set);
      if (open) next.delete(commentId);
      else next.add(commentId);
      return next;
    });
    if (open) return;

    this.posts$.loadReplies(commentId).subscribe({
      error: err => this.actionError.set(apiErrorMessage(err)),
    });
  }

  loadMoreReplies(commentId: string): void {
    this.posts$.loadMoreReplies(commentId).subscribe({
      error: err => this.actionError.set(apiErrorMessage(err)),
    });
  }

  // ── Composers ────────────────────────────────────────────────────────────

  isComposerOpen(target: ComposerTarget): boolean {
    return this.openComposer() === target;
  }

  draftFor(target: string): string {
    return this.drafts()[target] ?? '';
  }

  setDraft(target: string, value: string): void {
    this.drafts.update(d => ({ ...d, [target]: value }));
  }

  openRootComposer(): void {
    this.composerError.set(null);
    this.openComposer.set('root');
  }

  /**
   * Opens a composer directly beneath the comment being replied to, so the reader can
   * still see what they are answering. `comment` is whichever node was clicked — a
   * reply is a valid target, and the server re-parents it onto the top-level ancestor.
   *
   * Expands the node too: a reply the author cannot see land reads as a failure.
   */
  startReply(comment: CommunityComment): void {
    this.composerError.set(null);
    this.openComposer.set(comment.id);

    const thread = comment.parentCommentId ?? comment.id;
    if (!this.isExpanded(thread)) this.toggleReplies(thread);
  }

  closeComposer(): void {
    this.openComposer.set(null);
    this.composerError.set(null);
  }

  send(target: ComposerTarget): void {
    if (!target || this.sending()) return;
    const body = this.draftFor(target).trim();
    if (!body) return;

    this.sending.set(true);
    this.composerError.set(null);
    const parentCommentId = target === 'root' ? undefined : target;

    this.posts$.addComment(this.postId(), body, parentCommentId).subscribe({
      next: () => {
        this.sending.set(false);
        this.drafts.update(d => {
          const next = { ...d };
          delete next[target];
          return next;
        });
        this.openComposer.set(null);
      },
      // The box stays open on failure so a rejected comment does not take the text
      // with it.
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
