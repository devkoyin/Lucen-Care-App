import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { of } from 'rxjs';

import { PostDetailComponent } from './post-detail.component';
import { environment } from '../../../../environments/environment';

const POST_ID = 'P1';
const POST = `${environment.apiUrl}/community/posts/${POST_ID}`;

function author(over: Record<string, unknown> = {}) {
  return { userId: 'U1', displayName: 'Amaka O.', initial: 'A', verified: false, ...over };
}

function comment(over: Record<string, unknown> = {}) {
  return {
    id: 'C1',
    postId: POST_ID,
    parentCommentId: null,
    author: author(),
    body: 'Take it with your largest meal.',
    reactionCount: 0,
    reactedByMe: false,
    createdAt: new Date().toISOString(),
    status: 'published',
    visibleToOthers: true,
    replyCount: 0,
    ...over,
  };
}

function post(over: Record<string, unknown> = {}) {
  return {
    id: POST_ID,
    communityId: 'C1',
    communityName: 'Diabetes Support',
    author: author(),
    title: 'Metformin side effects',
    body: 'Any tips?',
    tags: [],
    commentCount: 1,
    reactionCount: 0,
    reactedByMe: false,
    createdAt: new Date().toISOString(),
    lastActivityAt: new Date().toISOString(),
    status: 'published',
    visibleToOthers: true,
    ...over,
  };
}

describe('PostDetailComponent', () => {
  let fixture: ComponentFixture<PostDetailComponent>;
  let component: PostDetailComponent;
  let http: HttpTestingController;

  beforeEach(async () => {
    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [PostDetailComponent, HttpClientTestingModule],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: { paramMap: of(convertToParamMap({ id: POST_ID })) },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(PostDetailComponent);
    component = fixture.componentInstance;
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  function init(p: unknown = post(), comments: unknown[] = [comment()]) {
    fixture.detectChanges();
    http.expectOne(POST).flush({ data: p, traceId: 't' });
    http.expectOne(r => r.url === `${POST}/comments`).flush({ data: comments, meta: {}, traceId: 't' });
    fixture.detectChanges();
  }

  it('loads the post and its thread', () => {
    init();
    expect(fixture.nativeElement.textContent).toContain('Metformin side effects');
    expect(fixture.nativeElement.textContent).toContain('Take it with your largest meal.');
  });

  // The API 404s a hidden post rather than 403-ing, so this branch covers both
  // "deleted" and "removed and not yours".
  it('shows an unavailable state on a 404', () => {
    fixture.detectChanges();
    http.expectOne(POST).flush({}, { status: 404, statusText: 'Not Found' });
    http.expectOne(r => r.url === `${POST}/comments`).flush({}, { status: 404, statusText: 'Not Found' });
    fixture.detectChanges();

    expect(component.notFound()).toBeTrue();
    expect(fixture.nativeElement.textContent).toContain('This post is not available');
  });

  describe('threading', () => {
    const repliesUrl = (id: string) => `${environment.apiUrl}/community/comments/${id}/replies`;

    // The list route now returns top-level comments only; replies arrive per comment.
    it('builds the thread from the top-level list, with replies empty until expanded', () => {
      init(post({ commentCount: 3 }), [
        comment({ id: 'TOP', replyCount: 1 }),
        comment({ id: 'OTHER', body: 'Same here.' }),
      ]);

      const thread = component.thread();
      expect(thread.map(n => n.comment.id)).toEqual(['TOP', 'OTHER']);
      expect(thread[0].replies).toEqual([]);
    });

    // The whole point of collapsing: a thread costs one request, not one per comment.
    it('does not fetch replies until the reader expands them', () => {
      init(post(), [comment({ id: 'TOP', replyCount: 2 })]);
      http.expectNone(repliesUrl('TOP'));

      component.toggleReplies('TOP');
      http.expectOne(r => r.url === repliesUrl('TOP')).flush({
        data: [comment({ id: 'R1', parentCommentId: 'TOP', body: 'Does that work at 1000mg?' })],
        meta: {},
        traceId: 't',
      });
      fixture.detectChanges();

      expect(component.thread()[0].replies.map(r => r.id)).toEqual(['R1']);
      expect(fixture.nativeElement.textContent).toContain('Does that work at 1000mg?');
    });

    it('re-expanding does not re-fetch what is already held', () => {
      init(post(), [comment({ id: 'TOP', replyCount: 1 })]);
      component.toggleReplies('TOP');
      http.expectOne(r => r.url === repliesUrl('TOP')).flush({ data: [], meta: {}, traceId: 't' });

      component.toggleReplies('TOP'); // collapse
      component.toggleReplies('TOP'); // expand again
      http.expectNone(repliesUrl('TOP'));
    });

    it('posts a reply against the comment being replied to', () => {
      init();
      component.startReply(component.thread()[0].comment);
      // startReply expands the node, which fetches its replies.
      http.expectOne(r => r.url === repliesUrl('C1')).flush({ data: [], meta: {}, traceId: 't' });

      component.setDraft('C1', 'Does that work at 1000mg?');
      component.send('C1');

      const req = http.expectOne(r => r.url === `${POST}/comments` && r.method === 'POST');
      expect(req.request.body.parentCommentId).toBe('C1');
      req.flush({ data: comment({ id: 'R1', parentCommentId: 'C1' }), traceId: 't' });
      fixture.detectChanges();

      expect(component.draftFor('C1')).toBe('');
      expect(component.isComposerOpen('C1')).toBeFalse();
      // It lands under its parent, and the parent's count follows.
      expect(component.thread()[0].replies.map(r => r.id)).toEqual(['R1']);
      expect(component.thread()[0].comment.replyCount).toBe(1);
    });

    // Replying to a reply must name and sit under the reply that was clicked, even
    // though the server stores the row against the top-level ancestor.
    it('opens the composer under the reply that was clicked', () => {
      init(post(), [comment({ id: 'TOP', replyCount: 1 })]);
      component.toggleReplies('TOP');
      http.expectOne(r => r.url === repliesUrl('TOP')).flush({
        data: [comment({ id: 'R1', parentCommentId: 'TOP', body: 'Me too' })],
        meta: {},
        traceId: 't',
      });
      fixture.detectChanges();

      component.startReply(component.thread()[0].replies[0]);
      expect(component.isComposerOpen('R1')).toBeTrue();

      component.setDraft('R1', 'Agreed');
      component.send('R1');
      const req = http.expectOne(r => r.url === `${POST}/comments` && r.method === 'POST');
      expect(req.request.body.parentCommentId).toBe('R1');
      req.flush({ data: comment({ id: 'R2', parentCommentId: 'TOP' }), traceId: 't' });
      fixture.detectChanges();

      // The server re-parented it, and the client trusts the response over the request.
      expect(component.thread()[0].replies.map(r => r.id)).toEqual(['R1', 'R2']);
    });

    it('keeps the draft when posting fails', () => {
      init();
      component.openRootComposer();
      component.setDraft('root', 'Something helpful');
      component.send('root');

      http.expectOne(r => r.method === 'POST').flush(
        { message: 'Join this community before posting in it' },
        { status: 403, statusText: 'Forbidden' },
      );
      fixture.detectChanges();

      expect(component.draftFor('root')).toBe('Something helpful');
      expect(component.composerError()).toContain('Join this community');
    });

    // Two open drafts must not clobber each other.
    it('keeps a draft when another composer is opened', () => {
      init();
      component.openRootComposer();
      component.setDraft('root', 'A new comment');

      component.startReply(component.thread()[0].comment);
      http.expectOne(r => r.url === repliesUrl('C1')).flush({ data: [], meta: {}, traceId: 't' });
      component.setDraft('C1', 'A reply');

      expect(component.draftFor('root')).toBe('A new comment');
      expect(component.draftFor('C1')).toBe('A reply');
    });

    // BR-18: a removed parent survives as a tombstone so its live replies stay reachable.
    it('renders a removed parent as a tombstone, still expandable', () => {
      init(post(), [
        comment({ id: 'TOP', body: '', visibleToOthers: false, status: 'hidden', replyCount: 1,
                  author: { userId: '', displayName: 'Community member', initial: 'C', verified: false } }),
      ]);

      expect(fixture.nativeElement.textContent).toContain('This comment was removed');
      expect(fixture.nativeElement.textContent).toContain('View 1 reply');
    });
  });

  describe('the composer', () => {
    it('stays collapsed until the Comment button is pressed', () => {
      init();
      expect(fixture.nativeElement.querySelector('.thread-composer')).toBeNull();

      component.openRootComposer();
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('.thread-composer')).not.toBeNull();
    });
  });

  it('reports a comment rather than the post when the comment menu is used', () => {
    init();
    component.openCommentReport(component.thread()[0].comment);
    expect(component.reportTargetType()).toBe('comment');

    component.submitReport({ reason: 'medical_advice' });
    const req = http.expectOne(`${environment.apiUrl}/community/comments/C1/reports`);
    expect(req.request.body.reason).toBe('medical_advice');
    req.flush({ data: { id: 'R1', status: 'pending' }, traceId: 't' });

    expect(component.reportDone()).toBeTrue();
  });
});
