import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';

import { CommunityModerationComponent } from './community-moderation.component';
import { environment } from '../../../../environments/environment';

const REPORTS = `${environment.apiUrl}/admin/community/reports`;

function report(over: Record<string, unknown> = {}) {
  return {
    id: 'R1',
    targetType: 'post',
    targetId: 'P1',
    communityId: 'C1',
    communityName: 'Diabetes Support',
    reason: 'personal_data',
    details: 'Shares a phone number',
    status: 'pending',
    createdAt: new Date().toISOString(),
    reporterDisplayName: 'Emeka O.',
    targetTitle: 'Metformin side effects',
    targetBody: 'Call me on 0803…',
    targetAuthorDisplayName: 'Amaka O.',
    targetAuthorVerified: false,
    targetHidden: false,
    openReportCount: 1,
    ...over,
  };
}

describe('CommunityModerationComponent', () => {
  let fixture: ComponentFixture<CommunityModerationComponent>;
  let component: CommunityModerationComponent;
  let http: HttpTestingController;

  beforeEach(async () => {
    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [CommunityModerationComponent, HttpClientTestingModule],
    }).compileComponents();

    fixture = TestBed.createComponent(CommunityModerationComponent);
    component = fixture.componentInstance;
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  function init(rows: unknown[] = [report()]) {
    fixture.detectChanges();
    http.expectOne(r => r.url === REPORTS).flush({ data: rows, meta: {}, traceId: 't' });
    fixture.detectChanges();
  }

  it('lists the queue and defaults to what is waiting', () => {
    init([report({ id: 'R1', status: 'pending' }), report({ id: 'R2', status: 'dismissed' })]);

    expect(component.activeTab()).toBe('pending');
    expect(component.filtered().map(r => r.id)).toEqual(['R1']);
    expect(component.countFor('all')).toBe(2);
  });

  // A moderator must be able to decide from the queue itself: an admin cannot open
  // the participant-facing post route at all — roleGuard('patient') rejects them.
  it('shows the reported content without leaving the queue', () => {
    init();
    component.toggleExpand('R1');
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Metformin side effects');
    expect(text).toContain('Call me on 0803');
    expect(text).toContain('Amaka O.');
  });

  it('surfaces how many people flagged the same content', () => {
    init([report({ openReportCount: 4 })]);
    expect(fixture.nativeElement.textContent).toContain('4 reports');
  });

  describe('removing content', () => {
    // The API 422s a hide with no note, and the note is what the author reads.
    it('will not submit without a reason', () => {
      init();
      component.startHide('R1');
      component.confirmHide('R1');

      http.expectNone(`${REPORTS}/R1`);
    });

    it('will not accept a whitespace-only reason', () => {
      init();
      component.startHide('R1');
      component.hideNote.set('   ');
      component.confirmHide('R1');

      http.expectNone(`${REPORTS}/R1`);
    });

    it('PATCHes the action and note, then refetches', () => {
      init();
      component.startHide('R1');
      component.hideNote.set('Contains a phone number');
      component.confirmHide('R1');

      const req = http.expectOne(`${REPORTS}/R1`);
      expect(req.request.method).toBe('PATCH');
      expect(req.request.body).toEqual({ action: 'hide', note: 'Contains a phone number' });
      req.flush({ data: report({ status: 'actioned' }), traceId: 't' });

      // A hide closes every other open report on the same target, so more than the
      // named row changes and the whole queue is reloaded.
      http.expectOne(r => r.url === REPORTS).flush({ data: [], meta: {}, traceId: 't' });
    });
  });

  it('dismisses without requiring a note', () => {
    init();
    component.dismiss('R1');

    const req = http.expectOne(`${REPORTS}/R1`);
    expect(req.request.body).toEqual({ action: 'dismiss' });
    req.flush({ data: report({ status: 'dismissed' }), traceId: 't' });

    http.expectOne(r => r.url === REPORTS).flush({ data: [], meta: {}, traceId: 't' });
  });

  it('reports a failed action rather than failing silently', () => {
    init();
    component.dismiss('R1');
    http.expectOne(`${REPORTS}/R1`).flush(
      { message: 'This report has already been reviewed' },
      { status: 409, statusText: 'Conflict' },
    );
    fixture.detectChanges();

    expect(component.actionError()).toContain('already been reviewed');
  });

  it('offers a working retry when the queue fails to load', () => {
    fixture.detectChanges();
    http.expectOne(r => r.url === REPORTS).flush({}, { status: 500, statusText: 'Error' });
    fixture.detectChanges();

    expect(component.loadError()).toBeTrue();
    expect(fixture.nativeElement.textContent).toContain('Could not load the moderation queue');

    component.reload();
    http.expectOne(r => r.url === REPORTS).flush({ data: [report()], meta: {}, traceId: 't' });
    fixture.detectChanges();
    expect(component.loadError()).toBeFalse();
  });
});
