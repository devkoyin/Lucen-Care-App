import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';

import { PatientMapComponent } from './patient-map.component';
import { AuthService } from '../../../core/auth/auth.service';
import { environment } from '../../../../environments/environment';

const ORG_ID = '01ORG00000000000000000001';
const MAP = `${environment.apiUrl}/organizations/${ORG_ID}/patient-map`;

function row(over: Record<string, unknown> = {}) {
  return {
    state: 'Lagos',
    selected: 8,
    inReview: 3,
    waitlisted: 1,
    total: 12,
    topCondition: 'Hypertension',
    ...over,
  };
}

describe('PatientMapComponent', () => {
  let fixture: ComponentFixture<PatientMapComponent>;
  let component: PatientMapComponent;
  let http: HttpTestingController;

  beforeEach(async () => {
    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [PatientMapComponent, HttpClientTestingModule],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: { me: () => of({ id: 'U1', email: 'a@b.c', role: 'ngo', status: 'active', orgId: ORG_ID }) } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(PatientMapComponent);
    component = fixture.componentInstance;
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  function init(rows: unknown[] = [row()]) {
    fixture.detectChanges();
    http.expectOne(r => r.url === MAP).flush({ data: rows, traceId: 't' });
    fixture.detectChanges();
  }

  it('renders per-state counts from the API', () => {
    init();

    expect(fixture.nativeElement.textContent).toContain('Lagos');
    expect(fixture.nativeElement.textContent).toContain('Hypertension');
    expect(component.totalSelected()).toBe(8);
  });

  it('shows an empty state before anyone has applied', () => {
    init([]);

    expect(fixture.nativeElement.textContent).toContain('No applicants yet');
  });

  it('shows an error with retry when the aggregation fails', () => {
    fixture.detectChanges();
    http.expectOne(r => r.url === MAP).flush({}, { status: 500, statusText: 'Error' });
    fixture.detectChanges();

    expect(component.loadError()).toBeTrue();
    expect(fixture.nativeElement.textContent).toContain('Could not load the distribution');
  });

  // Patients who onboarded before location existed must still be counted.
  it('counts Unspecified applicants but not as a state reached', () => {
    init([row(), row({ state: 'Unspecified', selected: 2, inReview: 1, waitlisted: 0, total: 3, topCondition: undefined })]);

    expect(component.totalSelected()).toBe(10);
    expect(component.statesReached()).toBe(1);
    expect(fixture.nativeElement.textContent).toContain('Unspecified');
  });

  it('summarises by geopolitical zone, skipping unmapped rows', () => {
    init([row(), row({ state: 'Kano', selected: 4 }), row({ state: 'Unspecified', selected: 2 })]);

    expect(component.zoneSummaries().map(z => z.zone)).toEqual(['North-West', 'South-West']);
    expect(component.zoneSummaries().find(z => z.zone === 'South-West')?.total).toBe(8);
  });

  describe('divide-by-zero guards', () => {
    it('renders 0% bars when nothing has been selected yet', () => {
      init([row({ selected: 0, inReview: 2, waitlisted: 0, total: 2 })]);

      expect(component.barWidth(0)).toBe(0);
      expect(component.zoneShare(0)).toBe(0);
    });

    it('scales bars against the busiest state', () => {
      init([row({ selected: 10 }), row({ state: 'Kano', selected: 5 })]);

      expect(component.barWidth(10)).toBe(100);
      expect(component.barWidth(5)).toBe(50);
    });
  });
});
