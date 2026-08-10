import { HttpParams } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { EMPTY, Observable, throwError } from 'rxjs';
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
   * Reactions already in flight, by target id. A second click while one is pending
   * is dropped rather than queued: two racing toggles land the count on whichever
   * response happens to return last, and a double-tap would otherwise show +2.
   */
  private readonly _pending = signal<ReadonlySet<string>>(new Set());

  readonly posts = this._posts.asReadonly();
  readonly post = this._post.asReadonly();
  readonly comments = this._comments.asReadonly();
  readonly scope = this._scope.asReadonly();
  readonly hasMore = computed(() => this._nextCursor() !== undefined);
  readonly hasMoreComments = computed(() => this._commentsCursor() !== undefined);

  isPending(id: string): boolean {
    return this._pending().has(id);
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

  addComment(postId: string, body: string, parentCommentId?: string): Observable<CommunityComment> {
    return this.api
      .postData<CommunityComment>(`/community/posts/${postId}/comments`, { body, parentCommentId })
      .pipe(
        tap(comment => {
          this._comments.update(list => [...list, comment]);
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

  private findComment(id: string): CommunityComment | undefined {
    return this._comments().find(c => c.id === id);
  }

  /**
   * A post can sit in the list and in the detail signal at once. Every mutation goes
   * through here so the two can never disagree.
   */
  private patchPost(id: string, fn: (p: CommunityPost) => CommunityPost): void {
    this._posts.update(list => list.map(p => (p.id === id ? fn(p) : p)));
    this._post.update(p => (p?.id === id ? fn(p) : p));
  }

  private patchComment(id: string, fn: (c: CommunityComment) => CommunityComment): void {
    this._comments.update(list => list.map(c => (c.id === id ? fn(c) : c)));
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
