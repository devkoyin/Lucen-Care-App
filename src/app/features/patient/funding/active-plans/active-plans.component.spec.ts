import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';

import { ActivePlansComponent } from './active-plans.component';
import { environment } from '../../../../../environments/environment';

const ENROLLMENTS = `${environment.apiUrl}/enrollments`;

function row(over: Record<string, unknown> = {}) {
  return {
    id: '01ENROLL000000000000000001',
    programId: '01PROGRAM0000000000000001',
    status: 'active',
    createdAt: '2026-07-01T00:00:00.000Z',
    programTitle: 'Chronic Care Fund',
    programType: 'ngo_funding',
    programExpiresAt: '2026-09-01T00:00:00.000Z',
    programDescription: 'Covers the full cost of monthly medication.',
    programFocus: 'Diabetes · Hypertension',
    programDonor: 'GSK Nigeria CSR',
    programCoordinator: 'Mrs Bisi Lawal',
    orgName: 'Hope Foundation',
    ...over,
  };
}

describe('ActivePlansComponent', () => {
  let fixture: ComponentFixture<ActivePlansComponent>;
  let component: ActivePlansComponent;
  let http: HttpTestingController;

  beforeEach(async () => {
    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [ActivePlansComponent, HttpClientTestingModule],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(ActivePlansComponent);
    component = fixture.componentInstance;
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  function init(enrollments: unknown[] = [row()]) {
    fixture.detectChanges();
    http.expectOne(r => r.url === ENROLLMENTS).flush({ data: { enrollments }, traceId: 't' });
    fixture.detectChanges();
  }

  it('lists the patient’s applications from the API', () => {
    init();
    expect(component.applications().length).toBe(1);
    expect(fixture.nativeElement.textContent).toContain('Chronic Care Fund');
    expect(fixture.nativeElement.textContent).toContain('Hope Foundation');
  });

  it('shows the empty state when nothing has been applied to', () => {
    init([]);
    expect(fixture.nativeElement.textContent).toContain('You have not applied to any programmes yet');
  });

  it('shows an error with retry when loading fails', () => {
    fixture.detectChanges();
    http.expectOne(r => r.url === ENROLLMENTS).flush({}, { status: 500, statusText: 'Error' });
    fixture.detectChanges();

    expect(component.loadError()).toBeTrue();
    expect(fixture.nativeElement.textContent).toContain('Could not load your applications');
  });

  describe('grouping by outcome', () => {
    it('splits applications into one group per status, decisions first', () => {
      init([
        row({ id: 'E1', status: 'active' }),
        row({ id: 'E2', status: 'selected' }),
        row({ id: 'E3', status: 'rejected', rejectionReason: 'Outside catchment area' }),
      ]);

      expect(component.groups().map(g => g.status)).toEqual(['selected', 'active', 'rejected']);
      expect(component.groups().every(g => g.rows.length === 1)).toBeTrue();
    });

    it('omits groups that have no applications', () => {
      init([row({ status: 'selected' })]);
      expect(component.groups().length).toBe(1);
      expect(fixture.nativeElement.textContent).not.toContain('Withdrawn');
    });

    // The whole point of the review workflow is that the patient learns the outcome.
    it('renders the NGO’s reason on a rejection', () => {
      init([row({ status: 'rejected', rejectionReason: 'Outside catchment area' })]);
      expect(fixture.nativeElement.textContent).toContain('Rejection reason:');
      expect(fixture.nativeElement.textContent).toContain('Outside catchment area');
    });

    it('shows the decision date once reviewed', () => {
      init([row({ status: 'selected', reviewedAt: '2026-07-20T00:00:00.000Z' })]);
      expect(fixture.nativeElement.textContent).toContain('Decision');
      expect(fixture.nativeElement.textContent).toContain('20 Jul 2026');
    });
  });

  describe('withdrawing', () => {
    it('offers withdraw while under review or waitlisted, not after a decision', () => {
      expect(component.canWithdraw(row() as never)).toBeTrue();
      expect(component.canWithdraw(row({ status: 'waitlisted' }) as never)).toBeTrue();
      expect(component.canWithdraw(row({ status: 'rejected' }) as never)).toBeFalse();
      expect(component.canWithdraw(row({ status: 'revoked_by_patient' }) as never)).toBeFalse();
    });

    it('confirms first, then DELETEs that one enrollment', () => {
      init();
      const target = component.applications()[0];

      component.askWithdraw(target);
      fixture.detectChanges();
      expect(fixture.nativeElement.textContent).toContain('Withdraw this application?');

      component.confirmWithdraw();
      const req = http.expectOne(`${ENROLLMENTS}/${target.id}`);
      expect(req.request.method).toBe('DELETE');
      req.flush({ data: { ...target, status: 'revoked_by_patient' }, traceId: 't' });
      fixture.detectChanges();

      // The row moves group rather than disappearing — the history stays visible.
      expect(component.groups().map(g => g.status)).toEqual(['revoked_by_patient']);
      expect(component.withdrawTarget()).toBeNull();
    });

    it('keeps the prompt open and reports the reason when withdrawal fails', () => {
      init();
      component.askWithdraw(component.applications()[0]);
      component.confirmWithdraw();

      http.expectOne(r => r.method === 'DELETE').flush(
        { status: 409, message: 'Cannot withdraw an enrollment that is expired' },
        { status: 409, statusText: 'Conflict' },
      );
      fixture.detectChanges();

      expect(component.actionError()).toContain('expired');
      expect(component.withdrawTarget()).not.toBeNull();
    });

    it('cancelling closes the prompt without calling the API', () => {
      init();
      component.askWithdraw(component.applications()[0]);
      component.cancelWithdraw();
      fixture.detectChanges();

      expect(component.withdrawTarget()).toBeNull();
    });
  });

  // What the patient read before applying should still be legible afterwards.
  describe('programme detail on the application', () => {
    it('carries the description, focus, donor and coordinator', () => {
      init();
      const text = fixture.nativeElement.textContent as string;

      expect(text).toContain('Covers the full cost of monthly medication');
      // Labelled, not bare — the same wording the browse card uses.
      expect(text).toContain('What this covers');
      expect(text).toContain('Supports Diabetes · Hypertension');
      expect(text).toContain('GSK Nigeria CSR');
      expect(text).toContain('Mrs Bisi Lawal');
    });

    it('renders cleanly for a programme that has none of them', () => {
      init([
        row({
          programDescription: null,
          programFocus: null,
          programDonor: null,
          programCoordinator: null,
        }),
      ]);

      const text = fixture.nativeElement.textContent as string;
      expect(text).toContain('Chronic Care Fund');
      expect(text).not.toContain('Funded by');
      expect(text).not.toContain('null');
    });
  });
});