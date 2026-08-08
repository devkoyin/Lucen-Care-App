import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { AllMedicationsComponent } from './all-medications.component';
import { Medication } from '../../../../core/medications/medications.models';
import { MedicationNotificationService } from '../../../../core/notifications/medication-notification.service';
import { environment } from '../../../../../environments/environment';

const MEDS_URL = `${environment.apiUrl}/medications`;
const STATS_URL = `${environment.apiUrl}/medications/stats`;

const apiMed = {
  id: 'MED1',
  name: 'Metformin',
  dosage: '500 mg',
  condition: 'Type 2 Diabetes',
  frequency: 'Twice daily',
  scheduleTimes: ['8:00 AM', '8:00 PM'],
  prescriber: 'Dr. Chen',
  specialty: 'Endocrinology',
  pillsRemaining: 24,
  pillsTotal: 60,
  refillDate: '2026-09-01',
};

describe('AllMedicationsComponent', () => {
  let fixture: ComponentFixture<AllMedicationsComponent>;
  let component: AllMedicationsComponent;
  let http: HttpTestingController;

  beforeEach(async () => {
    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [AllMedicationsComponent, HttpClientTestingModule],
      providers: [
        // Registers a browser notification permission prompt otherwise.
        { provide: MedicationNotificationService, useValue: { register: () => {} } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AllMedicationsComponent);
    component = fixture.componentInstance;
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  function init(meds: unknown[] = []) {
    fixture.detectChanges();
    http.expectOne(r => r.url === MEDS_URL).flush({ data: meds, traceId: 't' });
    fixture.detectChanges();
  }

  it('lists medications from the API', () => {
    init([apiMed]);
    expect(component.medications().length).toBe(1);
    expect(fixture.nativeElement.textContent).toContain('Metformin');
  });

  // A failed load used to render an empty list under "0 active prescriptions".
  describe('load states', () => {
    it('distinguishes an empty list from a failed load', () => {
      init([]);
      const text = fixture.nativeElement.textContent as string;
      expect(text).toContain('No medications yet');
      expect(component.loadError()).toBeFalse();
    });

    it('shows an error with a retry when the request fails', () => {
      fixture.detectChanges();
      http
        .expectOne(r => r.url === MEDS_URL)
        .flush({ message: 'boom' }, { status: 500, statusText: 'Error' });
      fixture.detectChanges();

      expect(component.loadError()).toBeTrue();
      expect(fixture.nativeElement.textContent).toContain('Could not load your medications');
    });

    it('refetches on retry', () => {
      fixture.detectChanges();
      http
        .expectOne(r => r.url === MEDS_URL)
        .flush({ message: 'boom' }, { status: 500, statusText: 'Error' });

      component.retry();
      http.expectOne(r => r.url === MEDS_URL).flush({ data: [apiMed], traceId: 't' });
      fixture.detectChanges();

      expect(component.loadError()).toBeFalse();
      expect(component.medications().length).toBe(1);
    });
  });

  describe('pillPercent', () => {
    function med(over: Partial<Medication>): Medication {
      return { ...(apiMed as unknown as Medication), ...over };
    }

    it('computes the remaining percentage', () => {
      expect(component.pillPercent(med({ pillsRemaining: 30, pillsTotal: 60 }))).toBe(50);
    });

    // Lowering pillsTotal below pillsRemaining used to overflow the refill bar.
    it('never exceeds 100', () => {
      expect(component.pillPercent(med({ pillsRemaining: 50, pillsTotal: 20 }))).toBe(100);
    });

    it('returns 0 rather than NaN when the total is zero', () => {
      expect(component.pillPercent(med({ pillsRemaining: 0, pillsTotal: 0 }))).toBe(0);
    });
  });

  // The stat tiles live on the parent shell; without this refresh "Active Meds"
  // kept its pre-add value until a full page reload.
  it('refreshes the list and the shared stats after a save', () => {
    init([]);

    component.onSaved();

    http.expectOne(r => r.url === MEDS_URL).flush({ data: [apiMed], traceId: 't' });
    http.expectOne(r => r.url === STATS_URL).flush({
      data: { activeMeds: 1, takenToday: 0, dueToday: 2, adherenceStreakDays: 3 },
      traceId: 't',
    });

    expect(component.medications().length).toBe(1);
  });

  describe('modal wiring', () => {
    it('opens in add mode with no medication attached', () => {
      init([apiMed]);
      component.openAdd();
      expect(component.showAddMed()).toBeTrue();
      expect(component.editingMed()).toBeNull();
    });

    it('opens in edit mode with the chosen medication', () => {
      init([apiMed]);
      component.openEdit(component.medications()[0]);
      expect(component.editingMed()?.id).toBe('MED1');
      expect(component.showAddMed()).toBeFalse();
    });

    it('closes both modes', () => {
      init([apiMed]);
      component.openEdit(component.medications()[0]);
      component.closeModal();
      expect(component.showAddMed()).toBeFalse();
      expect(component.editingMed()).toBeNull();
    });
  });
});
