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
    it('nests replies under their parent, one level deep', () => {
      init(post({ commentCount: 3 }), [
        comment({ id: 'TOP' }),
        comment({ id: 'R1', parentCommentId: 'TOP', body: 'Does that work at 1000mg?' }),
        comment({ id: 'OTHER', body: 'Same here.' }),
      ]);

      const thread = component.thread();
      expect(thread.map(n => n.comment.id)).toEqual(['TOP', 'OTHER']);
      expect(thread[0].replies.map(r => r.id)).toEqual(['R1']);
      expect(thread[1].replies).toEqual([]);
    });

    it('posts a reply against the comment being replied to', () => {
      init();
      component.startReply(component.thread()[0].comment);
      component.draft.set('Does that work at 1000mg?');
      component.send();

      const req = http.expectOne(r => r.url === `${POST}/comments` && r.method === 'POST');
      expect(req.request.body.parentCommentId).toBe('C1');
      req.flush({ data: comment({ id: 'R1', parentCommentId: 'C1' }), traceId: 't' });
      fixture.detectChanges();

      // The composer resets so the next comment is not accidentally a reply too.
      expect(component.draft()).toBe('');
      expect(component.replyingTo()).toBeNull();
    });

    it('keeps the draft when posting fails', () => {
      init();
      component.draft.set('Something helpful');
      component.send();

      http.expectOne(r => r.method === 'POST').flush(
        { message: 'Join this community before posting in it' },
        { status: 403, statusText: 'Forbidden' },
      );
      fixture.detectChanges();

      expect(component.draft()).toBe('Something helpful');
      expect(component.composerError()).toContain('Join this community');
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
