import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';

import { ApplicantsComponent } from './applicants.component';
import { AuthService } from '../../../core/auth/auth.service';
import { environment } from '../../../../environments/environment';

const ORG_ID = '01ORG00000000000000000001';
const PROGRAM_ID = '01PROGRAM0000000000000001';
const PROGRAMS = `${environment.apiUrl}/organizations/${ORG_ID}/programs`;
const APPLICANTS = `${environment.apiUrl}/programs/${PROGRAM_ID}/enrollments`;

function program(over: Record<string, unknown> = {}) {
  return {
    id: PROGRAM_ID,
    orgId: ORG_ID,
    title: 'Chronic Care Fund',
    type: 'ngo_funding',
    status: 'approved',
    lifecycle: 'Active',
    eligibilityCriteria: [],
    expiresAt: '2026-12-01T00:00:00.000Z',
    budgetDisbursed: 0,
    slotsTotal: 50,
    slotsFilled: 34,
    slotsAvailable: 16,
    ...over,
  };
}

function applicant(over: Record<string, unknown> = {}) {
  return {
    id: '01ENROLL000000000000000001',
    status: 'active',
    createdAt: '2026-07-01T00:00:00.000Z',
    sharedDataSnapshot: {
      name: 'Amina Bello',
      conditionTags: ['Diabetes'],
      address: 'Ikeja, Lagos',
      directContactShared: false,
    },
    ...over,
  };
}

describe('ApplicantsComponent', () => {
  let fixture: ComponentFixture<ApplicantsComponent>;
  let component: ApplicantsComponent;
  let http: HttpTestingController;

  beforeEach(async () => {
    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [ApplicantsComponent, HttpClientTestingModule],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: { me: () => of({ id: 'U1', email: 'a@b.c', role: 'ngo', status: 'active', orgId: ORG_ID }) } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ApplicantsComponent);
    component = fixture.componentInstance;
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  /** The queue is per-programme, so the programme list loads before the applicants. */
  function init(rows: unknown[] = [applicant()], programs: unknown[] = [program()]) {
    fixture.detectChanges();
    http.expectOne(r => r.url === PROGRAMS).flush({ data: programs, traceId: 't' });
    if (programs.length) {
      http.expectOne(r => r.url === APPLICANTS).flush({ data: rows, traceId: 't' });
    }
    fixture.detectChanges();
  }

  it('lists applicants for the first programme', () => {
    init();
    expect(component.applicants().length).toBe(1);
    expect(fixture.nativeElement.textContent).toContain('Amina Bello');
    expect(fixture.nativeElement.textContent).toContain('Diabetes');
  });

  it('shows an empty state when nobody has applied', () => {
    init([]);
    expect(fixture.nativeElement.textContent).toContain('No applications to this programme yet');
  });

  it('tells the NGO when it has no programmes at all', () => {
    init([], []);
    expect(fixture.nativeElement.textContent).toContain('You have no programmes yet');
  });

  it('shows an error when the applicant list fails', () => {
    fixture.detectChanges();
    http.expectOne(r => r.url === PROGRAMS).flush({ data: [program()], traceId: 't' });
    http.expectOne(r => r.url === APPLICANTS).flush({}, { status: 500, statusText: 'Error' });
    fixture.detectChanges();

    expect(component.loadError()).toBeTrue();
    expect(fixture.nativeElement.textContent).toContain('Could not load applicants');
  });

  describe('filtering', () => {
    it('filters by status tab', () => {
      init([applicant({ id: 'E1' }), applicant({ id: 'E2', status: 'selected' })]);

      component.setTab('selected');
      expect(component.filtered().map(a => a.id)).toEqual(['E2']);
      expect(component.countFor('active')).toBe(1);
    });

    it('searches name and condition tags', () => {
      init([
        applicant({ id: 'E1' }),
        applicant({ id: 'E2', sharedDataSnapshot: { name: 'Chidi Okeke', conditionTags: ['Asthma'] } }),
      ]);

      component.search.set('asthma');
      expect(component.filtered().map(a => a.id)).toEqual(['E2']);
    });
  });

  describe('reviewing', () => {
    it('selects an applicant and refreshes the programme counters', () => {
      init();
      const target = component.applicants()[0];

      component.select(target);

      const req = http.expectOne(`${APPLICANTS}/${target.id}`);
      expect(req.request.method).toBe('PATCH');
      expect(req.request.body).toEqual({ status: 'selected' });
      req.flush({ data: { ...target, status: 'selected' }, traceId: 't' });

      // Selecting consumes a place, so the programme list is re-read.
      http.expectOne(r => r.url === PROGRAMS).flush({ data: [program({ slotsFilled: 35 })], traceId: 't' });
      fixture.detectChanges();

      expect(component.applicants()[0].status).toBe('selected');
    });

    it('will not select into a full programme', () => {
      init([applicant()], [program({ lifecycle: 'Full', slotsFilled: 50, slotsAvailable: 0 })]);

      expect(component.isFull()).toBeTrue();
      expect(fixture.nativeElement.textContent).toContain('This programme is full');

      const button: HTMLButtonElement = fixture.nativeElement.querySelector('.app-btn--select');
      expect(button.disabled).toBeTrue();
    });

    it('requires a reason before it will send a rejection', () => {
      init();
      component.startReject(component.applicants()[0]);
      fixture.detectChanges();
      expect(fixture.nativeElement.textContent).toContain('Reject this applicant?');

      // Empty reason: the API would 422, so the click is a no-op instead.
      component.confirmReject();
      http.expectNone(r => r.method === 'PATCH');

      component.rejectReason.set('Outside catchment area');
      component.confirmReject();

      const req = http.expectOne(r => r.method === 'PATCH');
      expect(req.request.body).toEqual({ status: 'rejected', reason: 'Outside catchment area' });
      req.flush({ data: { ...component.applicants()[0], status: 'rejected', rejectionReason: 'Outside catchment area' }, traceId: 't' });
      http.expectOne(r => r.url === PROGRAMS).flush({ data: [program()], traceId: 't' });
      fixture.detectChanges();

      expect(component.rejecting()).toBeNull();
      expect(fixture.nativeElement.textContent).toContain('Outside catchment area');
    });

    it('reports the API reason when a review is refused', () => {
      init();
      component.waitlist(component.applicants()[0]);

      http.expectOne(r => r.method === 'PATCH').flush(
        { status: 409, message: 'Program has no places left' },
        { status: 409, statusText: 'Conflict' },
      );
      fixture.detectChanges();

      expect(component.actionError()).toContain('no places left');
      expect(component.busyId()).toBeNull();
    });

    it('offers no actions on an enrollment the patient withdrew', () => {
      init([applicant({ status: 'revoked_by_patient' })]);
      expect(component.canReview(component.applicants()[0])).toBeFalse();
      expect(fixture.nativeElement.querySelector('.app-btn')).toBeNull();
    });
  });

  // CLAUDE.md §8: an NGO reads the snapshot, never the patient record.
  it('renders only snapshot fields — no patient identifiers', () => {
    init();
    const html: string = fixture.nativeElement.innerHTML;
    expect(html).not.toContain('patientId');
    expect(html).not.toContain('consentGrantId');
  });
});
