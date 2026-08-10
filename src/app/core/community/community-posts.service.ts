import { HttpParams } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { EMPTY, Observable, of, throwError } from 'rxjs';
import { catchError, finalize, map, tap } from 'rxjs/operators';

import { ApiService } from '../api/api.service';
import { WrappedResponse } from '../api/wrapped-response.model';
import {
  CommunityComment,
  CommunityPost,
  CommunityStats,
  ReactionResult,
  ReportReason,
  ReportTargetType,
  TrendingTag,
} from './community.models';

/** What the feed is currently showing. `loadMore` needs it to page consistently. */
export interface FeedScope {
  communityId?: string;
  tag?: string;
  joinedOnly?: boolean;
}

@Injectable({ providedIn: 'root' })
export class CommunityPostsService {
  private readonly api = inject(ApiService);

  private readonly _posts = signal<CommunityPost[]>([]);
  private readonly _nextCursor = signal<string | undefined>(undefined);
  private readonly _scope = signal<FeedScope>({});

  private readonly _post = signal<CommunityPost | null>(null);
  private readonly _comments = signal<CommunityComment[]>([]);
  private readonly _commentsCursor = signal<string | undefined>(undefined);

  /**
   * Replies keyed by their top-level parent, fetched only when a reader expands that
   * comment. Nesting is one level, so this is a map of arrays rather than a tree.
   *
   * Kept separate from `_comments` rather than derived from one flat list: the flat
   * version paged both kinds together, so a reply whose parent fell on an earlier page
   * had nothing to nest under and the thread silently dropped it.
   */
  private readonly _replies = signal<Record<string, CommunityComment[]>>({});
  private readonly _repliesCursor = signal<Record<string, string | undefined>>({});
  private readonly _repliesLoading = signal<ReadonlySet<string>>(new Set());

  /**
   * Reactions already in flight, by target id. A second click while one is pending
   * is dropped rather than queued: two racing toggles land the count on whichever
   * response happens to return last, and a double-tap would otherwise show +2.
   */
  private readonly _pending = signal<ReadonlySet<string>>(new Set());

  readonly posts = this._posts.asReadonly();
  readonly post = this._post.asReadonly();
  readonly comments = this._comments.asReadonly();
  readonly replies = this._replies.asReadonly();
  readonly scope = this._scope.asReadonly();
  readonly hasMore = computed(() => this._nextCursor() !== undefined);
  readonly hasMoreComments = computed(() => this._commentsCursor() !== undefined);

  isPending(id: string): boolean {
    return this._pending().has(id);
  }

  repliesFor(commentId: string): CommunityComment[] {
    return this._replies()[commentId] ?? [];
  }

  /** True once this comment's replies have been fetched, even if there were none. */
  hasLoadedReplies(commentId: string): boolean {
    return this._replies()[commentId] !== undefined;
  }

  isLoadingReplies(commentId: string): boolean {
    return this._repliesLoading().has(commentId);
  }

  hasMoreReplies(commentId: string): boolean {
    return this._repliesCursor()[commentId] !== undefined;
  }

  // ── Feed ─────────────────────────────────────────────────────────────────

  /**
   * Replaces the list and resets the cursor.
   *
   * Filtering is a server query, not a client `filter()`. Over a paginated list a
   * client-side filter would narrow one page and silently present it as the whole
   * result — which is what the seed-data version did, correctly only because the
   * whole array was in memory.
   */
  loadFeed(scope: FeedScope = {}, limit = 20): Observable<CommunityPost[]> {
    this._scope.set(scope);
    return this.api
      .get<WrappedResponse<CommunityPost[]>>('/community/posts', this.feedParams(scope, limit))
      .pipe(
        tap(r => {
          this._posts.set(r.data);
          this._nextCursor.set(r.meta?.cursor);
        }),
        map(r => r.data),
      );
  }

  loadMore(limit = 20): Observable<CommunityPost[]> {
    const cursor = this._nextCursor();
    if (!cursor) return this.loadFeed(this._scope(), limit);

    return this.api
      .get<WrappedResponse<CommunityPost[]>>(
        '/community/posts',
        this.feedParams(this._scope(), limit).set('cursor', cursor),
      )
      .pipe(
        tap(r => {
          this._posts.update(list => [...list, ...r.data]);
          this._nextCursor.set(r.meta?.cursor);
        }),
        map(r => r.data),
      );
  }

  /** The caller's own posts, including any a moderator hid. */
  loadMyPosts(limit = 20): Observable<CommunityPost[]> {
    return this.api
      .get<WrappedResponse<CommunityPost[]>>('/community/posts/mine', new HttpParams().set('limit', limit))
      .pipe(map(r => r.data));
  }

  /** Posts nobody has answered — the professional dashboard's queue. */
  loadUnanswered(limit = 20): Observable<CommunityPost[]> {
    return this.api
      .get<WrappedResponse<CommunityPost[]>>(
        '/community/posts/unanswered',
        new HttpParams().set('limit', limit),
      )
      .pipe(map(r => r.data));
  }

  loadPost(id: string): Observable<CommunityPost> {
    return this.api.getData<CommunityPost>(`/community/posts/${id}`).pipe(tap(p => this._post.set(p)));
  }

  create(
    communityId: string,
    payload: { title?: string; body: string; tags?: string[] },
  ): Observable<CommunityPost> {
    return this.api
      .postData<CommunityPost>(`/community/communities/${communityId}/posts`, payload)
      .pipe(
        tap(post => {
          // Only prepend when the new post belongs in what is currently on screen.
          // Blind-prepending would show a post the active filter excludes.
          const scope = this._scope();
          if (!scope.communityId || scope.communityId === post.communityId) {
            this._posts.update(list => [post, ...list]);
          }
        }),
      );
  }

  // ── Reactions ────────────────────────────────────────────────────────────

  /**
   * Optimistic, with a full rollback.
   *
   * The heart has to answer the tap, not the round trip. On success the server's
   * count wins — other people reacted while this request was in the air. On failure
   * the WHOLE captured row is restored rather than a `-1`, so a rollback that races
   * a concurrent patch cannot leave the count drifting.
   */
  toggleReaction(post: CommunityPost): Observable<ReactionResult> {
    return this.toggle(post.id, post.reactedByMe, 'posts', () => this.findPost(post.id), row =>
      this.patchPost(post.id, () => row),
    );
  }

  toggleCommentReaction(comment: CommunityComment): Observable<ReactionResult> {
    return this.toggle(comment.id, comment.reactedByMe, 'comments', () => this.findComment(comment.id), row =>
      this.patchComment(comment.id, () => row),
    );
  }

  private toggle<T extends { reactedByMe: boolean; reactionCount: number }>(
    id: string,
    reacted: boolean,
    segment: 'posts' | 'comments',
    snapshot: () => T | undefined,
    restore: (row: T) => void,
  ): Observable<ReactionResult> {
    if (this._pending().has(id)) return EMPTY;
    const before = snapshot();
    if (!before) return EMPTY;

    const optimistic = {
      ...before,
      reactedByMe: !before.reactedByMe,
      reactionCount: before.reactedByMe ? Math.max(0, before.reactionCount - 1) : before.reactionCount + 1,
    };
    restore(optimistic as T);
    this.setPending(id, true);

    const path = `/community/${segment}/${id}/reactions`;
    const req = reacted
      ? this.api.delete<WrappedResponse<ReactionResult>>(path)
      : this.api.post<WrappedResponse<ReactionResult>>(path, {});

    return req.pipe(
      map(r => r.data),
      tap(result =>
        restore({ ...(optimistic as T), reactedByMe: result.reacted, reactionCount: result.reactionCount }),
      ),
      catchError(err => {
        restore(before);
        return throwError(() => err);
      }),
      finalize(() => this.setPending(id, false)),
    );
  }

  // ── Comments ─────────────────────────────────────────────────────────────

  /** Top-level comments only. Replies come from `loadReplies` on expand. */
  loadComments(postId: string, limit = 30): Observable<CommunityComment[]> {
    return this.api
      .get<WrappedResponse<CommunityComment[]>>(
        `/community/posts/${postId}/comments`,
        new HttpParams().set('limit', limit),
      )
      .pipe(
        tap(r => {
          this._comments.set(r.data);
          this._commentsCursor.set(r.meta?.cursor);
          // A new thread must not inherit the last one's expanded replies.
          this._replies.set({});
          this._repliesCursor.set({});
        }),
        map(r => r.data),
      );
  }

  loadMoreComments(postId: string, limit = 30): Observable<CommunityComment[]> {
    const cursor = this._commentsCursor();
    if (!cursor) return this.loadComments(postId, limit);

    return this.api
      .get<WrappedResponse<CommunityComment[]>>(
        `/community/posts/${postId}/comments`,
        new HttpParams().set('limit', limit).set('cursor', cursor),
      )
      .pipe(
        tap(r => {
          this._comments.update(list => [...list, ...r.data]);
          this._commentsCursor.set(r.meta?.cursor);
        }),
        map(r => r.data),
      );
  }

  /**
   * The replies under one comment. Idempotent per comment unless `force` is set —
   * collapsing and re-expanding must not re-fetch what is already held.
   */
  loadReplies(commentId: string, limit = 30, force = false): Observable<CommunityComment[]> {
    if (!force && this.hasLoadedReplies(commentId)) {
      return of(this.repliesFor(commentId));
    }
    this.setRepliesLoading(commentId, true);
    return this.api
      .get<WrappedResponse<CommunityComment[]>>(
        `/community/comments/${commentId}/replies`,
        new HttpParams().set('limit', limit),
      )
      .pipe(
        tap(r => {
          this._replies.update(map => ({ ...map, [commentId]: r.data }));
          this._repliesCursor.update(map => ({ ...map, [commentId]: r.meta?.cursor }));
        }),
        map(r => r.data),
        finalize(() => this.setRepliesLoading(commentId, false)),
      );
  }

  loadMoreReplies(commentId: string, limit = 30): Observable<CommunityComment[]> {
    const cursor = this._repliesCursor()[commentId];
    if (!cursor) return of(this.repliesFor(commentId));

    this.setRepliesLoading(commentId, true);
    return this.api
      .get<WrappedResponse<CommunityComment[]>>(
        `/community/comments/${commentId}/replies`,
        new HttpParams().set('limit', limit).set('cursor', cursor),
      )
      .pipe(
        tap(r => {
          this._replies.update(map => ({ ...map, [commentId]: [...(map[commentId] ?? []), ...r.data] }));
          this._repliesCursor.update(map => ({ ...map, [commentId]: r.meta?.cursor }));
        }),
        map(r => r.data),
        finalize(() => this.setRepliesLoading(commentId, false)),
      );
  }

  /**
   * `parentCommentId` is the comment the reader clicked Reply on, which may itself be
   * a reply. The server re-parents anything deeper onto its top-level ancestor, so the
   * row that comes back tells us where it actually belongs — always trust the response
   * over the request here, or a reply-to-a-reply lands under the wrong node.
   */
  addComment(postId: string, body: string, parentCommentId?: string): Observable<CommunityComment> {
    return this.api
      .postData<CommunityComment>(`/community/posts/${postId}/comments`, { body, parentCommentId })
      .pipe(
        tap(comment => {
          const parent = comment.parentCommentId;
          if (parent) {
            // Only append if this thread is already expanded; otherwise the count bump
            // alone is right and the reply arrives whenever the reader opens it.
            if (this.hasLoadedReplies(parent)) {
              this._replies.update(map => ({ ...map, [parent]: [...(map[parent] ?? []), comment] }));
            }
            this.patchComment(parent, c => ({ ...c, replyCount: c.replyCount + 1 }));
          } else {
            this._comments.update(list => [...list, comment]);
          }
          this.patchPost(postId, p => ({ ...p, commentCount: p.commentCount + 1 }));
        }),
      );
  }

  // ── Reporting, stats, discovery ──────────────────────────────────────────

  report(
    target: ReportTargetType,
    id: string,
    reason: ReportReason,
    details?: string,
  ): Observable<{ id: string; status: string }> {
    const segment = target === 'post' ? 'posts' : 'comments';
    return this.api.postData<{ id: string; status: string }>(`/community/${segment}/${id}/reports`, {
      reason,
      ...(details ? { details } : {}),
    });
  }

  loadStats(): Observable<CommunityStats> {
    return this.api.getData<CommunityStats>('/community/stats');
  }

  loadTrending(): Observable<TrendingTag[]> {
    return this.api.getData<TrendingTag[]>('/community/trending');
  }

  // ── Internals ────────────────────────────────────────────────────────────

  private feedParams(scope: FeedScope, limit: number): HttpParams {
    let params = new HttpParams().set('limit', limit);
    if (scope.communityId) params = params.set('communityId', scope.communityId);
    if (scope.tag) params = params.set('tag', scope.tag);
    if (scope.joinedOnly) params = params.set('joinedOnly', 'true');
    return params;
  }

  private findPost(id: string): CommunityPost | undefined {
    return this._posts().find(p => p.id === id) ?? (this._post()?.id === id ? this._post()! : undefined);
  }

  /** Searches top-level comments first, then every expanded reply list. */
  private findComment(id: string): CommunityComment | undefined {
    const top = this._comments().find(c => c.id === id);
    if (top) return top;
    for (const list of Object.values(this._replies())) {
      const hit = list.find(c => c.id === id);
      if (hit) return hit;
    }
    return undefined;
  }

  /**
   * A post can sit in the list and in the detail signal at once. Every mutation goes
   * through here so the two can never disagree.
   */
  private patchPost(id: string, fn: (p: CommunityPost) => CommunityPost): void {
    this._posts.update(list => list.map(p => (p.id === id ? fn(p) : p)));
    this._post.update(p => (p?.id === id ? fn(p) : p));
  }

  /**
   * A comment lives in exactly one of the two stores, but reacting to a reply has to
   * work as well as reacting to a top-level comment, so both are patched.
   */
  private patchComment(id: string, fn: (c: CommunityComment) => CommunityComment): void {
    this._comments.update(list => list.map(c => (c.id === id ? fn(c) : c)));
    this._replies.update(map => {
      let touched = false;
      const next: Record<string, CommunityComment[]> = {};
      for (const [parent, list] of Object.entries(map)) {
        if (list.some(c => c.id === id)) {
          touched = true;
          next[parent] = list.map(c => (c.id === id ? fn(c) : c));
        } else {
          next[parent] = list;
        }
      }
      return touched ? next : map;
    });
  }

  private setRepliesLoading(id: string, on: boolean): void {
    this._repliesLoading.update(set => {
      const next = new Set(set);
      if (on) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  private setPending(id: string, on: boolean): void {
    this._pending.update(set => {
      const next = new Set(set);
      if (on) next.add(id);
      else next.delete(id);
      return next;
    });
  }
}
