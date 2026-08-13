import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';

import { CommunityComponent } from './community.component';
import { environment } from '../../../environments/environment';

const POSTS = `${environment.apiUrl}/community/posts`;
const COMMUNITIES = `${environment.apiUrl}/community/communities`;

function author(over: Record<string, unknown> = {}) {
  return {
    userId: '01USER0000000000000000001',
    displayName: 'Amaka O.',
    initial: 'A',
    verified: false,
    ...over,
  };
}

function post(over: Record<string, unknown> = {}) {
  return {
    id: '01POST0000000000000000001',
    communityId: '01COMM0000000000000000001',
    communityName: 'Diabetes Support',
    communityAccent: '#D97706',
    author: author(),
    title: 'Anyone else managing Metformin stomach issues?',
    body: 'Three months in and still nauseous.',
    tags: ['Metformin'],
    commentCount: 4,
    reactionCount: 2,
    reactedByMe: false,
    createdAt: new Date().toISOString(),
    lastActivityAt: new Date().toISOString(),
    status: 'published',
    visibleToOthers: true,
    ...over,
  };
}

function group(over: Record<string, unknown> = {}) {
  return {
    id: '01COMM0000000000000000001',
    slug: 'diabetes-support',
    name: 'Diabetes Support',
    tags: [],
    status: 'active',
    memberCount: 12,
    postCount: 3,
    joined: true,
    createdAt: new Date().toISOString(),
    ...over,
  };
}

describe('CommunityComponent', () => {
  let fixture: ComponentFixture<CommunityComponent>;
  let component: CommunityComponent;
  let http: HttpTestingController;

  beforeEach(async () => {
    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [CommunityComponent, HttpClientTestingModule],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(CommunityComponent);
    component = fixture.componentInstance;
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  /** Both requests the feed fires on init: the group list and the posts. */
  function init(posts: unknown[] = [post()], groups: unknown[] = [group()]) {
    fixture.detectChanges();
    http.expectOne(r => r.url === COMMUNITIES).flush({ data: groups, traceId: 't' });
    http.expectOne(r => r.url === POSTS).flush({ data: posts, meta: {}, traceId: 't' });
    fixture.detectChanges();
  }

  it('renders the feed from the API', () => {
    init();
    expect(component.posts().length).toBe(1);
    expect(fixture.nativeElement.textContent).toContain('Anyone else managing Metformin stomach issues?');
  });

  // The regression guard for the whole privacy design: the client renders whatever
  // display name the server sent and builds nothing itself. There is deliberately
  // no AuthService spy anywhere in this file — its absence IS the assertion.
  describe('author identity comes from the server', () => {
    it('renders the pseudonymised patient name verbatim', () => {
      init([post({ author: author({ displayName: 'Amaka O.', initial: 'A' }) })]);
      expect(fixture.nativeElement.textContent).toContain('Amaka O.');
    });

    it('renders a professional’s full name and their badge', () => {
      init([
        post({
          author: author({
            displayName: 'Dr Yemi Adekunle',
            initial: 'D',
            verified: true,
            badge: 'verified-professional',
            specialty: 'Endocrinology',
          }),
        }),
      ]);

      const text = fixture.nativeElement.textContent as string;
      expect(text).toContain('Dr Yemi Adekunle');
      expect(text).toContain('Verified Health Professional');
    });

    it('renders a benefactor badge', () => {
      init([post({ author: author({ displayName: 'Adunola Fashola', badge: 'verified-benefactor' }) })]);
      expect(fixture.nativeElement.textContent).toContain('Verified Benefactor');
    });

    it('shows no badge for a plain patient', () => {
      init();
      expect(fixture.nativeElement.textContent).not.toContain('Verified');
    });
  });

  describe('states', () => {
    it('shows the empty state when nothing has been posted', () => {
      init([]);
      expect(fixture.nativeElement.textContent).toContain('The community is quiet right now');
    });

    it('shows an error with a working Retry when the feed fails', () => {
      fixture.detectChanges();
      http.expectOne(r => r.url === COMMUNITIES).flush({ data: [], traceId: 't' });
      http.expectOne(r => r.url === POSTS).flush({}, { status: 500, statusText: 'Error' });
      fixture.detectChanges();

      expect(component.loadError()).toBeTrue();
      expect(fixture.nativeElement.textContent).toContain('Could not load the community feed');

      component.reload();
      http.expectOne(r => r.url === POSTS).flush({ data: [post()], meta: {}, traceId: 't' });
      fixture.detectChanges();
      expect(component.loadError()).toBeFalse();
    });
  });

  // Filtering has to be a server query: over a paginated list, filtering the loaded
  // page and presenting it as the whole result is a lie.
  describe('filtering', () => {
    it('asks the server for one community rather than filtering in memory', () => {
      init();
      component.setFilter('01COMM0000000000000000002');

      const req = http.expectOne(r => r.url === POSTS && r.params.get('communityId') === '01COMM0000000000000000002');
      req.flush({ data: [], meta: {}, traceId: 't' });
      fixture.detectChanges();

      expect(component.posts().length).toBe(0);
    });

    it('builds its chips from the real group list, joined ones first', () => {
      init([post()], [
        group({ id: 'G1', name: 'Heart Health', joined: false }),
        group({ id: 'G2', name: 'Diabetes Support', joined: true }),
      ]);

      expect(component.filters().map(f => f.label)).toEqual(['All', 'Diabetes Support', 'Heart Health']);
    });
  });

  // A brand-new account has joined nothing, so this is the very first thing a new
  // user tries. A disabled button with no explanation reads as a broken app.
  describe('the New Post button always does something', () => {
    it('opens the composer even when the user has joined no communities', () => {
      // Communities exist; this account has joined none — the state every new
      // patient lands in once the starter set is seeded.
      init([], [group({ joined: false })]);

      const btn = fixture.nativeElement.querySelector('.community-primary-btn') as HTMLButtonElement;
      expect(btn.disabled).toBeFalse();

      btn.click();
      fixture.detectChanges();

      expect(component.showNewPost()).toBeTrue();
      expect(fixture.nativeElement.textContent).toContain('Join a community before posting');
    });

    // A genuinely empty platform: "join a community" would be advice with no
    // referent, so the modal has to say something else.
    it('invites a patient to found the first one when none exist', () => {
      init([], []);

      (fixture.nativeElement.querySelector('.community-primary-btn') as HTMLElement).click();
      fixture.detectChanges();

      expect(component.anyCommunityExists()).toBeFalse();
      expect(fixture.nativeElement.textContent).toContain('There are no communities yet');
    });

    it('opens the composer normally when they have joined one', () => {
      init([], [group({ joined: true })]);

      const btn = fixture.nativeElement.querySelector('.community-primary-btn') as HTMLButtonElement;
      btn.click();
      fixture.detectChanges();

      expect(component.showNewPost()).toBeTrue();
      expect(fixture.nativeElement.textContent).not.toContain('Join a community before posting');
    });

    // Otherwise a failed group fetch disables posting forever, with no way back.
    it('still opens the composer when the group list failed to load', () => {
      fixture.detectChanges();
      http.expectOne(r => r.url === COMMUNITIES).flush({}, { status: 500, statusText: 'Error' });
      http.expectOne(r => r.url === POSTS).flush({ data: [], meta: {}, traceId: 't' });
      fixture.detectChanges();

      const btn = fixture.nativeElement.querySelector('.community-primary-btn') as HTMLButtonElement;
      expect(btn.disabled).toBeFalse();
    });
  });

  describe('reporting', () => {
    it('POSTs the reason and shows the acknowledgement', () => {
      init();
      component.openReport(component.posts()[0]);
      component.submitReport({ reason: 'personal_data' });

      const req = http.expectOne(`${POSTS}/01POST0000000000000000001/reports`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body.reason).toBe('personal_data');
      req.flush({ data: { id: 'R1', status: 'pending' }, traceId: 't' });

      expect(component.reportDone()).toBeTrue();
    });

    // Already reported means their intent was satisfied — surfacing it as an error
    // would tell the user something went wrong when nothing did.
    it('treats a 409 "already reported" as success', () => {
      init();
      component.openReport(component.posts()[0]);
      component.submitReport({ reason: 'spam' });

      http.expectOne(r => r.method === 'POST').flush(
        { message: 'You have already reported this' },
        { status: 409, statusText: 'Conflict' },
      );

      expect(component.reportDone()).toBeTrue();
      expect(component.reportError()).toBeNull();
    });
  });
});
