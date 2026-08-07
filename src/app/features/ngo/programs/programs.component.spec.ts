import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';

import { ProgramsComponent } from './programs.component';
import { AuthService } from '../../../core/auth/auth.service';
import { environment } from '../../../../environments/environment';

const ORG_ID = '01ORG00000000000000000001';
const LIST = `${environment.apiUrl}/organizations/${ORG_ID}/programs`;

function program(over: Record<string, unknown> = {}) {
  return {
    id: '01PROGRAM0000000000000001',
    orgId: ORG_ID,
    title: 'Chronic Care Fund',
    type: 'ngo_funding',
    status: 'approved',
    lifecycle: 'Active',
    eligibilityCriteria: [{ field: 'conditionTags', operator: 'in', value: ['Diabetes'] }],
    expiresAt: '2026-12-01T00:00:00.000Z',
    budgetTotal: 1_850_000_000, // kobo → ₦18.5M
    budgetDisbursed: 1_120_000_000,
    slotsTotal: 50,
    slotsFilled: 34,
    slotsAvailable: 16,
    ...over,
  };
}

describe('ProgramsComponent', () => {
  let fixture: ComponentFixture<ProgramsComponent>;
  let component: ProgramsComponent;
  let http: HttpTestingController;

  beforeEach(async () => {
    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [ProgramsComponent, HttpClientTestingModule],
      providers: [
        provideRouter([]),
        // orgId comes from /auth/me, not the token.
        { provide: AuthService, useValue: { me: () => of({ id: 'U1', email: 'a@b.c', role: 'ngo', status: 'active', orgId: ORG_ID }) } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ProgramsComponent);
    component = fixture.componentInstance;
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  function init(rows: unknown[] = [program()]) {
    fixture.detectChanges();
    http.expectOne(r => r.url === LIST).flush({ data: rows, traceId: 't' });
    fixture.detectChanges();
  }

  it('lists the org’s programmes from the API', () => {
    init();
    expect(component.programs().length).toBe(1);
    expect(fixture.nativeElement.textContent).toContain('Chronic Care Fund');
  });

  it('shows an error with retry when loading fails', () => {
    fixture.detectChanges();
    http.expectOne(r => r.url === LIST).flush({}, { status: 500, statusText: 'Error' });
    fixture.detectChanges();

    expect(component.loadError()).toBeTrue();
    expect(fixture.nativeElement.textContent).toContain('Could not load your programmes');
  });

  // Two distinct empty states: "you have none" is not the same as "none match".
  it('prompts to create when the org has no programmes at all', () => {
    init([]);
    expect(fixture.nativeElement.textContent).toContain('You have no programmes yet');
  });

  it('says none match when a filter excludes everything', () => {
    init([program()]);

    component.setFilter('Paused');
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('No programs match this filter');
  });

  // Pause and Resume previously had no (click) binding at all.
  describe('pause and resume', () => {
    it('pausing PATCHes paused: true', () => {
      init();

      component.setPaused(component.programs()[0], true);

      const req = http.expectOne(`${environment.apiUrl}/programs/${program().id}`);
      expect(req.request.method).toBe('PATCH');
      expect(req.request.body).toEqual({ paused: true });
      req.flush({ data: program({ lifecycle: 'Paused', pausedAt: '2026-08-06T00:00:00.000Z' }), traceId: 't' });

      expect(component.programs()[0].lifecycle).toBe('Paused');
    });

    it('resuming PATCHes paused: false', () => {
      init([program({ lifecycle: 'Paused' })]);

      component.setPaused(component.programs()[0], false);

      const req = http.expectOne(`${environment.apiUrl}/programs/${program().id}`);
      expect(req.request.body).toEqual({ paused: false });
      req.flush({ data: program({ lifecycle: 'Active' }), traceId: 't' });

      expect(component.programs()[0].lifecycle).toBe('Active');
    });

    it('surfaces a failure rather than silently doing nothing', () => {
      init();
      component.setPaused(component.programs()[0], true);

      http.expectOne(`${environment.apiUrl}/programs/${program().id}`).flush(
        { message: 'nope' }, { status: 500, statusText: 'Error' },
      );
      fixture.detectChanges();

      expect(component.actionError()).toBeTruthy();
      expect(component.busyId()).toBeNull();
    });

    it('ignores a second click while one is in flight', () => {
      init();
      component.setPaused(component.programs()[0], true);
      component.setPaused(component.programs()[0], true);

      http.expectOne(`${environment.apiUrl}/programs/${program().id}`)
        .flush({ data: program(), traceId: 't' });
    });
  });

  describe('money and capacity display', () => {
    it('converts kobo to naira for the totals', () => {
      init();
      // 1,850,000,000 kobo = ₦18.5M
      expect(component.formatAmount(component.totalBudget())).toBe('₦18.5M');
    });

    it('formats amounts under a thousand instead of showing ₦1K', () => {
      expect(component.formatAmount(500)).toBe('₦500');
    });

    it('reports 0% rather than NaN for an uncapped programme', () => {
      init([program({ slotsTotal: undefined, budgetTotal: undefined })]);
      const p = component.programs()[0];
      expect(component.fillPercent(p)).toBe(0);
      expect(component.budgetPercent(p)).toBe(0);
      expect(component.slotsLabel(p)).toBe('Unlimited');
      expect(component.budgetLabel(p)).toBe('Not set');
    });
  });

  it('filters on the derived lifecycle, not the review status', () => {
    init([program({ lifecycle: 'Active' }), program({ id: 'P2', lifecycle: 'Full' })]);

    component.setFilter('Full');
    expect(component.filtered().length).toBe(1);
    expect(component.filtered()[0].lifecycle).toBe('Full');
  });
});
