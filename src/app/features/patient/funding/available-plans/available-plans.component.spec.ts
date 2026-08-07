import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';

import { AvailablePlansComponent } from './available-plans.component';
import { environment } from '../../../../../environments/environment';

const BROWSE = `${environment.apiUrl}/programs/browse`;
const ENROLLMENTS = `${environment.apiUrl}/enrollments`;

const program = {
  id: '01PROGRAM0000000000000001',
  orgId: '01ORG00000000000000000001',
  title: 'Chronic Care Fund',
  type: 'ngo_funding',
  expiresAt: '2026-09-01T00:00:00.000Z',
};

describe('AvailablePlansComponent', () => {
  let fixture: ComponentFixture<AvailablePlansComponent>;
  let component: AvailablePlansComponent;
  let http: HttpTestingController;

  beforeEach(async () => {
    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [AvailablePlansComponent, HttpClientTestingModule],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(AvailablePlansComponent);
    component = fixture.componentInstance;
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  /** ngOnInit fires both feeds via forkJoin. */
  function init(programs: unknown[] = [program], enrollments: unknown[] = []) {
    fixture.detectChanges();
    http.expectOne(r => r.url === BROWSE).flush({ data: programs, traceId: 't' });
    http.expectOne(r => r.url === ENROLLMENTS).flush({ data: { enrollments }, traceId: 't' });
    fixture.detectChanges();
  }

  it('lists programmes from the API', () => {
    init();
    expect(component.programs().length).toBe(1);
    expect(fixture.nativeElement.textContent).toContain('Chronic Care Fund');
  });

  it('shows an empty state when no programmes are open', () => {
    init([]);
    expect(fixture.nativeElement.textContent).toContain('No programmes available right now');
  });

  it('shows an error with retry when loading fails', () => {
    fixture.detectChanges();
    // Answer the sibling first: forkJoin cancels outstanding requests as soon as one
    // errors, so flushing browse first would leave nothing to match here.
    http.expectOne(r => r.url === ENROLLMENTS).flush({ data: { enrollments: [] }, traceId: 't' });
    http.expectOne(r => r.url === BROWSE).flush({}, { status: 500, statusText: 'Error' });
    fixture.detectChanges();

    expect(component.loadError()).toBeTrue();
    expect(fixture.nativeElement.textContent).toContain('Could not load programmes');
  });

  it('marks a programme applied from real enrollment data', () => {
    init([program], [{ id: 'E1', programId: program.id, status: 'active', createdAt: '', programTitle: '', programType: '', programExpiresAt: '' }]);
    expect(component.isApplied(program.id)).toBeTrue();
    expect(fixture.nativeElement.textContent).toContain('Applied');
  });

  describe('applying', () => {
    it('posts and then refetches enrollments so the card settles from the server', () => {
      init();

      component.apply(program as never);

      http.expectOne(ENROLLMENTS).flush({ data: {}, traceId: 't' });
      // The refetch is what flips the card, not an optimistic local flag.
      http.expectOne(r => r.url === ENROLLMENTS).flush(
        { data: { enrollments: [{ id: 'E1', programId: program.id, status: 'active', createdAt: '', programTitle: '', programType: '', programExpiresAt: '' }] }, traceId: 't' },
      );

      expect(component.isApplied(program.id)).toBeTrue();
    });

    // Each backend refusal means something different to the patient.
    it('422 about consent offers a route to fix it', () => {
      init();
      component.apply(program as never);

      http.expectOne(ENROLLMENTS).flush(
        { status: 422, message: 'No active NGO_FUNDING consent grant' },
        { status: 422, statusText: 'Unprocessable Entity' },
      );
      fixture.detectChanges();

      expect(component.needsConsent()).toBeTrue();
      expect(fixture.nativeElement.textContent).toContain('Manage sharing settings');
    });

    it('a different 422 shows the API reason without offering the consent route', () => {
      init();
      component.apply(program as never);

      http.expectOne(ENROLLMENTS).flush(
        { status: 422, message: 'Program has expired' },
        { status: 422, statusText: 'Unprocessable Entity' },
      );
      fixture.detectChanges();

      expect(component.needsConsent()).toBeFalse();
      expect(component.applyError()).toContain('expired');
    });

    // Already enrolled is not a failure worth showing — reconcile instead.
    it('409 silently reconciles into the Applied state', () => {
      init();
      component.apply(program as never);

      http.expectOne(ENROLLMENTS).flush(
        { status: 409, message: 'Patient is already actively enrolled in this program' },
        { status: 409, statusText: 'Conflict' },
      );
      http.expectOne(r => r.url === ENROLLMENTS).flush(
        { data: { enrollments: [{ id: 'E1', programId: program.id, status: 'active', createdAt: '', programTitle: '', programType: '', programExpiresAt: '' }] }, traceId: 't' },
      );
      fixture.detectChanges();

      expect(component.applyError()).toBeNull();
      expect(component.isApplied(program.id)).toBeTrue();
    });

    it('an unexpected failure shows a generic message and re-enables the button', () => {
      init();
      component.apply(program as never);

      http.expectOne(ENROLLMENTS).flush({}, { status: 500, statusText: 'Error' });
      fixture.detectChanges();

      expect(component.applyError()).toContain('Could not submit');
      expect(component.applyingId()).toBeNull();
    });

    it('ignores a second click while one application is in flight', () => {
      init();
      component.apply(program as never);
      component.apply(program as never);

      http.expectOne(ENROLLMENTS).flush({ data: {}, traceId: 't' });
      http.expectOne(r => r.url === ENROLLMENTS).flush({ data: { enrollments: [] }, traceId: 't' });
    });
  });
});
