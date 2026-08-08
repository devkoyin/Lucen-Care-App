import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { Router, provideRouter } from '@angular/router';

import { NotificationsComponent } from './notifications.component';
import { environment } from '../../../../environments/environment';

const FEED = `${environment.apiUrl}/notifications/me`;

function notification(over: Record<string, unknown> = {}) {
  return {
    id: '01NOTIF000000000000000001',
    type: 'enrollment_application',
    category: 'application',
    title: 'New application received',
    body: 'Someone applied to Chronic Care Fund.',
    payload: { programId: '01PROGRAM0000000000000001' },
    read: false,
    createdAt: '2026-07-01T09:00:00.000Z',
    ...over,
  };
}

describe('NotificationsComponent', () => {
  let fixture: ComponentFixture<NotificationsComponent>;
  let component: NotificationsComponent;
  let http: HttpTestingController;

  beforeEach(async () => {
    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [NotificationsComponent, HttpClientTestingModule],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(NotificationsComponent);
    component = fixture.componentInstance;
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  function init(rows: unknown[] = [notification()], unreadCount = 1, nextCursor?: string) {
    fixture.detectChanges();
    http
      .expectOne(r => r.url === FEED)
      .flush({ data: { notifications: rows, unreadCount, nextCursor }, traceId: 't' });
    fixture.detectChanges();
  }

  it('renders the feed with server-rendered copy', () => {
    init();

    expect(fixture.nativeElement.textContent).toContain('New application received');
    expect(fixture.nativeElement.textContent).toContain('1 unread');
  });

  it('shows an empty state when there is nothing', () => {
    init([], 0);

    expect(fixture.nativeElement.textContent).toContain('Nothing yet');
  });

  it('shows an error with retry when the feed fails', () => {
    fixture.detectChanges();
    http.expectOne(r => r.url === FEED).flush({}, { status: 500, statusText: 'Error' });
    fixture.detectChanges();

    expect(component.loadError()).toBeTrue();
    expect(fixture.nativeElement.textContent).toContain('Could not load notifications');
  });

  // An NGO never receives a `care` notification; a fixed tab row would strand one empty.
  it('builds tabs from the categories actually present', () => {
    init([notification(), notification({ id: 'N2', category: 'system', type: 'org_verified' })], 2);

    expect(component.tabs().map(t => t.key)).toEqual(['all', 'application', 'system']);
  });

  it('filters by category', () => {
    init([notification(), notification({ id: 'N2', category: 'system', type: 'org_verified' })], 2);

    component.setFilter('system');
    expect(component.filtered().map(n => n.id)).toEqual(['N2']);
  });

  describe('opening a notification', () => {
    it('marks it read and follows its deep link', () => {
      const router = TestBed.inject(Router);
      const navigate = spyOn(router, 'navigate');
      init();

      component.open(component.notifications()[0]);

      const req = http.expectOne(`${FEED.replace('/me', '')}/01NOTIF000000000000000001/read`);
      expect(req.request.method).toBe('PATCH');
      req.flush({ data: notification({ read: true }), traceId: 't' });

      expect(component.unreadCount()).toBe(0);
      expect(navigate).toHaveBeenCalledWith(['/ngo/applicants'], {
        queryParams: { programId: '01PROGRAM0000000000000001' },
      });
    });

    it('does not re-mark one that is already read', () => {
      init([notification({ read: true })], 0);

      component.open(component.notifications()[0]);

      http.expectNone(r => r.method === 'PATCH');
    });
  });

  it('marks everything read in one call', () => {
    init([notification(), notification({ id: 'N2' })], 2);

    component.markAllRead();

    const req = http.expectOne(`${environment.apiUrl}/notifications/read-all`);
    expect(req.request.method).toBe('PATCH');
    req.flush({ data: { updated: 2 }, traceId: 't' });

    expect(component.unreadCount()).toBe(0);
    expect(component.notifications().every(n => n.read)).toBeTrue();
  });

  it('pages older notifications from the cursor', () => {
    init([notification()], 1, '01NOTIF000000000000000001');
    expect(component.hasMore()).toBeTrue();

    component.loadMore();

    const req = http.expectOne(r => r.url === FEED && r.params.get('cursor') !== null);
    req.flush({ data: { notifications: [notification({ id: 'N0' })], unreadCount: 1 }, traceId: 't' });

    expect(component.notifications().map(n => n.id)).toEqual([
      '01NOTIF000000000000000001',
      'N0',
    ]);
    expect(component.hasMore()).toBeFalse();
  });
});
