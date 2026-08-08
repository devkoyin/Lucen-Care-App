import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { signal } from '@angular/core';
import { of } from 'rxjs';

import { NgoDashboardComponent } from './ngo-dashboard.component';
import { AuthService } from '../../../core/auth/auth.service';
import { User } from '../../../core/auth/auth.models';
import { environment } from '../../../../environments/environment';

const ORG_ID = '01ORG00000000000000000001';
const PROGRAM_ID = '01PROGRAM0000000000000001';
const STATS = `${environment.apiUrl}/organizations/${ORG_ID}/stats`;
const PROGRAMS = `${environment.apiUrl}/organizations/${ORG_ID}/programs`;
const APPLICANTS = `${environment.apiUrl}/programs/${PROGRAM_ID}/enrollments`;

const mockUser: User = { id: '1', role: 'ngo', name: 'Help Org', email: 'a@ngo.org', status: 'active' };

const stats = {
  activePrograms: 2,
  totalPrograms: 4,
  totalApplicants: 31,
  pendingReview: 7,
  selectedPatients: 18,
  waitlisted: 4,
  rejected: 2,
  budgetTotal: 0,
  budgetDisbursed: 0,
  slotsTotal: 50,
  slotsFilled: 34,
};

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
    slotsFilled: 25,
    slotsAvailable: 25,
    ...over,
  };
}

function applicant(over: Record<string, unknown> = {}) {
  return {
    id: '01ENROLL000000000000000001',
    status: 'active',
    createdAt: '2026-07-01T00:00:00.000Z',
    sharedDataSnapshot: { name: 'Amina Bello', conditionTags: ['Diabetes'] },
    ...over,
  };
}

describe('NgoDashboardComponent', () => {
  let fixture: ComponentFixture<NgoDashboardComponent>;
  let component: NgoDashboardComponent;
  let http: HttpTestingController;

  beforeEach(async () => {
    TestBed.resetTestingModule();
    const authSpy = jasmine.createSpyObj<AuthService>(
      'AuthService',
      ['login', 'signup', 'signOut', 'isAuthenticated', 'role'],
      { user: signal(mockUser) },
    );
    // orgId comes from /auth/me, not the cached user.
    (authSpy as unknown as { me: unknown }).me = () =>
      of({ id: '1', email: 'a@ngo.org', role: 'ngo', status: 'active', orgId: ORG_ID });

    await TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, NgoDashboardComponent],
      providers: [provideRouter([]), { provide: AuthService, useValue: authSpy }],
    }).compileComponents();

    fixture = TestBed.createComponent(NgoDashboardComponent);
    component = fixture.componentInstance;
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  /** Stats and programmes load together; the recent list follows once programmes land. */
  function init(programs: unknown[] = [program()], applicants: unknown[] = [applicant()]) {
    fixture.detectChanges();
    http.expectOne(r => r.url === STATS).flush({ data: stats, traceId: 't' });
    http.expectOne(r => r.url === PROGRAMS).flush({ data: programs, traceId: 't' });
    if (programs.length) {
      http.expectOne(r => r.url === APPLICANTS).flush({ data: applicants, traceId: 't' });
    }
    fixture.detectChanges();
  }

  it('shows the org name', () => {
    init();
    expect(component.orgName).toBe('Help Org');
  });

  it('renders four stat cards from the stats endpoint', () => {
    init();

    const cards: HTMLElement[] = Array.from(fixture.nativeElement.querySelectorAll('.stat-card'));
    expect(cards.length).toBe(4);
    expect(fixture.nativeElement.textContent).toContain('31'); // total applicants
    expect(fixture.nativeElement.textContent).toContain('7');  // pending review
  });

  it('lists the org’s programmes with their derived lifecycle', () => {
    init();

    expect(fixture.nativeElement.querySelectorAll('.program-item').length).toBe(1);
    expect(fixture.nativeElement.textContent).toContain('Chronic Care Fund');
    expect(fixture.nativeElement.textContent).toContain('Active');
  });

  it('shows recent applicants, newest first, across programmes', () => {
    init([program()], [
      applicant({ id: 'E1', createdAt: '2026-07-01T00:00:00.000Z' }),
      applicant({ id: 'E2', createdAt: '2026-07-09T00:00:00.000Z', sharedDataSnapshot: { name: 'Chidi Okeke', conditionTags: ['Asthma'] } }),
    ]);

    expect(component.recent().map(r => r.id)).toEqual(['E2', 'E1']);
    expect(fixture.nativeElement.textContent).toContain('Chidi Okeke');
  });

  it('shows an empty state rather than fabricated rows when there is nothing yet', () => {
    init([], []);

    expect(fixture.nativeElement.textContent).toContain('You have not created a programme yet');
    expect(fixture.nativeElement.textContent).toContain('No applications yet');
  });

  it('shows an error with retry when the dashboard cannot load', () => {
    fixture.detectChanges();
    http.expectOne(r => r.url === PROGRAMS).flush({ data: [], traceId: 't' });
    http.expectOne(r => r.url === STATS).flush({}, { status: 500, statusText: 'Error' });
    fixture.detectChanges();

    expect(component.loadError()).toBeTrue();
    expect(fixture.nativeElement.textContent).toContain('Could not load your dashboard');
  });

  // A programme with no cap must not render NaN%.
  it('guards the fill bar against an uncapped programme', () => {
    init([program({ slotsTotal: undefined, slotsFilled: 12 })]);

    expect(component.fillPercent(component.programs()[0])).toBe(0);
  });
});
