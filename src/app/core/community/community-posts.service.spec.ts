import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';

import { CommunityPostsService } from './community-posts.service';
import { CommunityPost } from './community.models';
import { environment } from '../../../environments/environment';

const POSTS = `${environment.apiUrl}/community/posts`;

function post(over: Partial<CommunityPost> = {}): CommunityPost {
  return {
    id: 'P1',
    communityId: 'C1',
    communityName: 'Diabetes Support',
    communityAccent: '#D97706',
    author: { userId: 'U1', displayName: 'Amaka O.', initial: 'A', verified: false },
    title: 'Metformin',
    body: 'Any tips?',
    tags: [],
    commentCount: 0,
    reactionCount: 8,
    reactedByMe: false,
    createdAt: new Date().toISOString(),
    lastActivityAt: new Date().toISOString(),
    status: 'published',
    visibleToOthers: true,
    ...over,
  };
}

describe('CommunityPostsService', () => {
  let svc: CommunityPostsService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ imports: [HttpClientTestingModule] });
    svc = TestBed.inject(CommunityPostsService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  function loadFeed(rows: CommunityPost[] = [post()], cursor?: string) {
    svc.loadFeed().subscribe();
    http.expectOne(r => r.url === POSTS).flush({ data: rows, meta: { cursor }, traceId: 't' });
  }

  // ── Optimistic reactions ─────────────────────────────────────────────────
  describe('reactions', () => {
    it('flips the signal before the request is answered', () => {
      loadFeed();
      svc.toggleReaction(svc.posts()[0]).subscribe({ error: () => {} });

      // Asserted BEFORE the flush: the heart must answer the tap, not the round trip.
      expect(svc.posts()[0].reactedByMe).toBeTrue();
      expect(svc.posts()[0].reactionCount).toBe(9);

      http.expectOne(`${POSTS}/P1/reactions`).flush({
        data: { reacted: true, reactionCount: 9 },
        traceId: 't',
      });
    });

    // Other people react while the request is in the air, so the server's count is
    // authoritative — not the local +1.
    it('reconciles to the server’s count, not the optimistic one', () => {
      loadFeed();
      svc.toggleReaction(svc.posts()[0]).subscribe();

      http.expectOne(`${POSTS}/P1/reactions`).flush({
        data: { reacted: true, reactionCount: 14 },
        traceId: 't',
      });

      expect(svc.posts()[0].reactionCount).toBe(14);
    });

    it('rolls the whole row back when the request fails', () => {
      loadFeed();
      svc.toggleReaction(svc.posts()[0]).subscribe({ error: () => {} });
      expect(svc.posts()[0].reactionCount).toBe(9);

      http.expectOne(`${POSTS}/P1/reactions`).flush({}, { status: 500, statusText: 'Error' });

      expect(svc.posts()[0].reactedByMe).toBeFalse();
      expect(svc.posts()[0].reactionCount).toBe(8);
    });

    // Without the pending guard a double-tap would issue two requests and land +2.
    it('drops a second click while one is in flight', () => {
      loadFeed();
      svc.toggleReaction(svc.posts()[0]).subscribe();
      svc.toggleReaction(svc.posts()[0]).subscribe();

      const reqs = http.match(`${POSTS}/P1/reactions`);
      expect(reqs.length).toBe(1);
      reqs[0].flush({ data: { reacted: true, reactionCount: 9 }, traceId: 't' });
    });

    it('allows a second click once the first has settled', () => {
      loadFeed();
      svc.toggleReaction(svc.posts()[0]).subscribe();
      http.expectOne(`${POSTS}/P1/reactions`).flush({ data: { reacted: true, reactionCount: 9 }, traceId: 't' });

      svc.toggleReaction(svc.posts()[0]).subscribe();
      const req = http.expectOne(`${POSTS}/P1/reactions`);
      expect(req.request.method).toBe('DELETE');
      req.flush({ data: { reacted: false, reactionCount: 8 }, traceId: 't' });

      expect(svc.posts()[0].reactionCount).toBe(8);
    });

    it('DELETEs when removing an existing reaction', () => {
      loadFeed([post({ reactedByMe: true, reactionCount: 9 })]);
      svc.toggleReaction(svc.posts()[0]).subscribe();

      const req = http.expectOne(`${POSTS}/P1/reactions`);
      expect(req.request.method).toBe('DELETE');
      req.flush({ data: { reacted: false, reactionCount: 8 }, traceId: 't' });
    });

    // A post can be in the list and in the detail signal at the same time.
    it('patches the list and the detail copy together', () => {
      loadFeed();
      svc.loadPost('P1').subscribe();
      http.expectOne(`${POSTS}/P1`).flush({ data: post(), traceId: 't' });

      svc.toggleReaction(svc.posts()[0]).subscribe();
      http.expectOne(`${POSTS}/P1/reactions`).flush({ data: { reacted: true, reactionCount: 9 }, traceId: 't' });

      expect(svc.posts()[0].reactionCount).toBe(9);
      expect(svc.post()!.reactionCount).toBe(9);
    });
  });

  // ── Pagination ───────────────────────────────────────────────────────────
  describe('cursor pagination', () => {
    it('loadMore appends and sends the cursor', () => {
      loadFeed([post({ id: 'P1' })], 'CURSOR1');
      expect(svc.hasMore()).toBeTrue();

      svc.loadMore().subscribe();
      const req = http.expectOne(r => r.url === POSTS && r.params.get('cursor') === 'CURSOR1');
      req.flush({ data: [post({ id: 'P2' })], meta: {}, traceId: 't' });

      expect(svc.posts().map(p => p.id)).toEqual(['P1', 'P2']);
      expect(svc.hasMore()).toBeFalse();
    });

    it('loadFeed replaces and resets the cursor', () => {
      loadFeed([post({ id: 'P1' })], 'CURSOR1');

      svc.loadFeed({ communityId: 'C2' }).subscribe();
      http.expectOne(r => r.url === POSTS && r.params.get('communityId') === 'C2')
        .flush({ data: [post({ id: 'P9' })], meta: {}, traceId: 't' });

      expect(svc.posts().map(p => p.id)).toEqual(['P9']);
      expect(svc.hasMore()).toBeFalse();
    });

    it('carries the active scope into loadMore', () => {
      svc.loadFeed({ communityId: 'C7', tag: 'Metformin' }).subscribe();
      http.expectOne(r => r.url === POSTS).flush({ data: [post()], meta: { cursor: 'X' }, traceId: 't' });

      svc.loadMore().subscribe();
      const req = http.expectOne(r => r.url === POSTS && r.params.get('cursor') === 'X');
      expect(req.request.params.get('communityId')).toBe('C7');
      expect(req.request.params.get('tag')).toBe('Metformin');
      req.flush({ data: [], meta: {}, traceId: 't' });
    });
  });

  // ── Creating ─────────────────────────────────────────────────────────────
  describe('create', () => {
    it('prepends when the new post belongs in the current scope', () => {
      loadFeed([post({ id: 'P1' })]);
      svc.create('C1', { body: 'New' }).subscribe();
      http.expectOne(`${environment.apiUrl}/community/communities/C1/posts`)
        .flush({ data: post({ id: 'P2' }), traceId: 't' });

      expect(svc.posts().map(p => p.id)).toEqual(['P2', 'P1']);
    });

    // Otherwise the feed shows a post the active filter excludes.
    it('does not prepend a post outside the filtered community', () => {
      svc.loadFeed({ communityId: 'C1' }).subscribe();
      http.expectOne(r => r.url === POSTS).flush({ data: [post({ id: 'P1' })], meta: {}, traceId: 't' });

      svc.create('C2', { body: 'Elsewhere' }).subscribe();
      http.expectOne(`${environment.apiUrl}/community/communities/C2/posts`)
        .flush({ data: post({ id: 'P2', communityId: 'C2' }), traceId: 't' });

      expect(svc.posts().map(p => p.id)).toEqual(['P1']);
    });
  });

  describe('comments', () => {
    it('appends a new comment and bumps the post’s count', () => {
      loadFeed([post({ id: 'P1', commentCount: 2 })]);
      svc.loadComments('P1').subscribe();
      http.expectOne(r => r.url === `${POSTS}/P1/comments`).flush({ data: [], meta: {}, traceId: 't' });

      svc.addComment('P1', 'Take it with food').subscribe();
      http.expectOne(r => r.url === `${POSTS}/P1/comments` && r.method === 'POST').flush({
        data: { id: 'C1', postId: 'P1', author: post().author, body: 'Take it with food', reactionCount: 0, reactedByMe: false, createdAt: new Date().toISOString(), status: 'published', visibleToOthers: true },
        traceId: 't',
      });

      expect(svc.comments().length).toBe(1);
      expect(svc.posts()[0].commentCount).toBe(3);
    });

    it('sends parentCommentId on a reply', () => {
      svc.addComment('P1', 'Yes', 'PARENT1').subscribe();
      const req = http.expectOne(r => r.url === `${POSTS}/P1/comments` && r.method === 'POST');
      expect(req.request.body.parentCommentId).toBe('PARENT1');
      req.flush({ data: { id: 'C2', postId: 'P1', parentCommentId: 'PARENT1', author: post().author, body: 'Yes', reactionCount: 0, reactedByMe: false, createdAt: new Date().toISOString(), status: 'published', visibleToOthers: true }, traceId: 't' });
    });
  });
});
