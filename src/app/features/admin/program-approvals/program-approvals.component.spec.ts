import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';

import { ProgramApprovalsComponent } from './program-approvals.component';
import { environment } from '../../../../environments/environment';

const PROGRAMS = `${environment.apiUrl}/admin/programs`;

function submission(over: Record<string, unknown> = {}) {
  return {
    id: '01PROGRAM0000000000000001',
    title: 'Chronic Care Fund',
    type: 'ngo_funding',
    status: 'pending_review',
    orgId: '01ORG00000000000000000001',
    orgName: 'Hope Health',
    orgContactEmail: 'admin@hope.org',
    description: 'Covers medication costs.',
    focus: 'Diabetes',
    eligibilityCriteria: [{ field: 'conditionTags', operator: 'in', value: ['Diabetes'] }],
    budgetTotal: 1_850_000_000,
    slotsTotal: 50,
    expiresAt: '2026-12-01T00:00:00.000Z',
    createdAt: '2026-07-01T00:00:00.000Z',
    ...over,
  };
}

describe('ProgramApprovalsComponent', () => {
  let fixture: ComponentFixture<ProgramApprovalsComponent>;
  let component: ProgramApprovalsComponent;
  let http: HttpTestingController;

  beforeEach(async () => {
    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [ProgramApprovalsComponent, HttpClientTestingModule],
    }).compileComponents();

    fixture = TestBed.createComponent(ProgramApprovalsComponent);
    component = fixture.componentInstance;
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  function init(rows: unknown[] = [submission()]) {
    fixture.detectChanges();
    http.expectOne(r => r.url === PROGRAMS).flush({ data: rows, traceId: 't' });
    fixture.detectChanges();
  }

  it('lists submitted programmes with their organisation', () => {
    init();

    expect(fixture.nativeElement.textContent).toContain('Chronic Care Fund');
    expect(fixture.nativeElement.textContent).toContain('Hope Health');
  });

  it('opens on the pending queue', () => {
    init([submission(), submission({ id: 'P2', status: 'approved' })]);

    expect(component.activeTab()).toBe('pending_review');
    expect(component.filtered().map(p => p.id)).toEqual(['01PROGRAM0000000000000001']);
    expect(component.countFor('approved')).toBe(1);
  });

  it('shows an empty state when nothing is waiting', () => {
    init([]);

    expect(fixture.nativeElement.textContent).toContain('No programmes in this category');
  });

  it('shows an error with retry when the queue cannot be loaded', () => {
    fixture.detectChanges();
    http.expectOne(r => r.url === PROGRAMS).flush({}, { status: 500, statusText: 'Error' });
    fixture.detectChanges();

    expect(component.loadError()).toBeTrue();
    expect(fixture.nativeElement.textContent).toContain('Could not load the review queue');
  });

  describe('reviewing', () => {
    it('approves with the { status } shape the endpoint expects', () => {
      init();

      component.approve('01PROGRAM0000000000000001');

      const req = http.expectOne(`${PROGRAMS}/01PROGRAM0000000000000001`);
      expect(req.request.method).toBe('PATCH');
      expect(req.request.body).toEqual({ status: 'approved' });
      req.flush({ data: {}, traceId: 't' });

      // Reloads so the row moves out of the pending tab.
      http.expectOne(r => r.url === PROGRAMS).flush({ data: [], traceId: 't' });
    });

    it('will not send a rejection without a reason', () => {
      init();
      component.startReject('01PROGRAM0000000000000001');

      component.confirmReject('01PROGRAM0000000000000001');

      http.expectNone(r => r.method === 'PATCH');
    });

    it('sends the reason on rejection — it is what the NGO reads', () => {
      init();
      component.startReject('01PROGRAM0000000000000001');
      component.rejectReason.set('Eligibility too broad');

      component.confirmReject('01PROGRAM0000000000000001');

      const req = http.expectOne(`${PROGRAMS}/01PROGRAM0000000000000001`);
      expect(req.request.body).toEqual({ status: 'rejected', reason: 'Eligibility too broad' });
      req.flush({ data: {}, traceId: 't' });
      http.expectOne(r => r.url === PROGRAMS).flush({ data: [], traceId: 't' });
    });

    it('reports the API reason when a review is refused', () => {
      init();

      component.approve('01PROGRAM0000000000000001');
      http.expectOne(r => r.method === 'PATCH').flush(
        { status: 409, message: 'Program is not in a reviewable state' },
        { status: 409, statusText: 'Conflict' },
      );
      fixture.detectChanges();

      expect(component.actionError()).toContain('reviewable state');
    });

    it('offers no buttons on a programme already decided', () => {
      init([submission({ status: 'approved' })]);
      component.setTab('all');
      component.toggleExpand('01PROGRAM0000000000000001');
      fixture.detectChanges();

      expect(fixture.nativeElement.querySelector('.btn-approve')).toBeNull();
    });
  });

  // An over-broad criterion is the thing a reviewer most needs to notice.
  it('flags a submission with no eligibility criteria', () => {
    init([submission({ eligibilityCriteria: [] })]);
    component.toggleExpand('01PROGRAM0000000000000001');
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('would match every consenting patient');
  });

  it('formats the kobo budget as naira', () => {
    init();

    expect(component.budgetLabel(component.submissions()[0])).toBe('₦18.5M');
  });
});
