import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { AddMedicationModalComponent } from './add-medication-modal.component';
import { Medication } from '../../../core/medications/medications.models';
import { environment } from '../../../../environments/environment';

const MEDS_URL = `${environment.apiUrl}/medications`;

const existing: Medication = {
  id: 'MED1',
  name: 'Metformin',
  dosage: '500 mg',
  condition: 'Type 2 Diabetes',
  frequency: 'Twice daily',
  schedule: ['8:00 AM', '8:00 PM'],
  prescriber: 'Dr. Chen',
  specialty: 'Endocrinology',
  pillsRemaining: 50,
  pillsTotal: 60,
  refillDate: '1 Aug 2026',
  refillDateISO: '2026-08-01',
  refillUrgency: 'ok',
  notes: 'Take with food',
};

describe('AddMedicationModalComponent', () => {
  let fixture: ComponentFixture<AddMedicationModalComponent>;
  let component: AddMedicationModalComponent;
  let http: HttpTestingController;

  beforeEach(async () => {
    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [AddMedicationModalComponent, HttpClientTestingModule],
    }).compileComponents();

    fixture = TestBed.createComponent(AddMedicationModalComponent);
    component = fixture.componentInstance;
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  /** Fills every required field for a single-dose medication. */
  function fillValid(): void {
    component.form.name = 'Metformin';
    component.form.dosage = '500 mg';
    component.form.condition = 'Type 2 Diabetes';
    component.form.frequency = 'Once daily';
    component.form.prescriber = 'Dr. Chen';
    component.form.specialty = 'Endocrinology';
    component.form.pillsTotal = 30;
    component.form.refillDateISO = '2026-09-01';
    component.doseTimes = ['09:15'];
  }

  it('creates', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  // THE root cause of "add medication does nothing": slice() truncates instead of
  // padding, so a short doseTimes array made every() pass vacuously. isValid said
  // yes, Angular's required validators said no, and submit() returned silently on a
  // button that looked clickable.
  describe('validation gate', () => {
    it('is invalid when there are fewer dose times than the frequency requires', () => {
      fillValid();
      component.form.frequency = 'Twice daily';
      component.doseTimes = ['08:00']; // slotCount is 2

      expect(component.slotCount).toBe(2);
      expect(component.isValid).toBeFalse();
    });

    it('is valid once every rendered slot has a time', () => {
      fillValid();
      component.form.frequency = 'Twice daily';
      component.doseTimes = ['08:00', '20:00'];

      expect(component.isValid).toBeTrue();
    });

    it('is invalid when a dose time in the middle is blank', () => {
      fillValid();
      component.form.frequency = 'Three times daily';
      component.doseTimes = ['08:00', '', '20:00'];

      expect(component.isValid).toBeFalse();
    });

    it('requires a specialty, which no form validator can catch', () => {
      fillValid();
      component.form.specialty = '';
      expect(component.isValid).toBeFalse();
    });

    it('requires a day of week for a weekly medication', () => {
      fillValid();
      component.form.frequency = 'Weekly';
      component.weeklyDay = '';
      expect(component.isValid).toBeFalse();

      component.weeklyDay = 'Monday';
      expect(component.isValid).toBeTrue();
    });

    it('names the missing fields so a disabled button is explainable', () => {
      fillValid();
      component.form.prescriber = '';
      component.form.specialty = '';

      expect(component.missingFieldsMessage).toContain('prescriber');
      expect(component.missingFieldsMessage).toContain('specialty');
    });
  });

  describe('onFrequencyChange', () => {
    // Sized from the event, not from form.frequency, so it cannot depend on the
    // [(ngModel)] write-back having already run.
    it('resizes dose times to the incoming frequency', () => {
      component.doseTimes = ['08:00'];
      component.onFrequencyChange('Three times daily');
      expect(component.doseTimes).toEqual(['', '', '']);
    });

    it('clears the weekly day when frequency changes', () => {
      component.weeklyDay = 'Monday';
      component.onFrequencyChange('Once daily');
      expect(component.weeklyDay).toBe('');
    });
  });

  describe('submit — create', () => {
    it('posts the mapped payload with 12-hour dose labels', () => {
      fixture.detectChanges();
      fillValid();

      component.submit({ invalid: false, submitted: true } as never);

      const req = http.expectOne(MEDS_URL);
      expect(req.request.method).toBe('POST');
      expect(req.request.body.scheduleTimes).toEqual(['9:15 AM']);
      expect(req.request.body.refillDate).toBe('2026-09-01');
      req.flush({ data: { ...existing, id: 'NEW' }, traceId: 't' });
    });

    it('composes the weekly label as "<Day> · <time>"', () => {
      fixture.detectChanges();
      fillValid();
      component.form.frequency = 'Weekly';
      component.weeklyDay = 'Monday';
      component.doseTimes = ['08:00'];

      component.submit({ invalid: false, submitted: true } as never);

      const req = http.expectOne(MEDS_URL);
      expect(req.request.body.scheduleTimes).toEqual(['Monday · 8:00 AM']);
      req.flush({ data: existing, traceId: 't' });
    });

    it('emits saved and close only after the API confirms', () => {
      fixture.detectChanges();
      fillValid();
      const saved = jasmine.createSpy('saved');
      const closed = jasmine.createSpy('close');
      component.saved.subscribe(saved);
      component.close.subscribe(closed);

      component.submit({ invalid: false, submitted: true } as never);

      // Still in flight — the old code emitted close synchronously here.
      expect(closed).not.toHaveBeenCalled();

      http.expectOne(MEDS_URL).flush({ data: existing, traceId: 't' });

      expect(saved).toHaveBeenCalled();
      expect(closed).toHaveBeenCalled();
    });

    it('does not fire a request when the form is invalid', () => {
      fixture.detectChanges();
      fillValid();
      component.form.specialty = '';

      component.submit({ invalid: false, submitted: true } as never);

      expect(http.match(MEDS_URL).length).toBe(0);
    });

    it('ignores a second submit while one is in flight', () => {
      fixture.detectChanges();
      fillValid();

      component.submit({ invalid: false, submitted: true } as never);
      component.submit({ invalid: false, submitted: true } as never);

      http.expectOne(MEDS_URL).flush({ data: existing, traceId: 't' });
    });
  });

  // The second root cause: errors were swallowed entirely and the modal tore itself
  // down mid-request, so the user lost everything they typed with no explanation.
  describe('submit — failure', () => {
    function submitAndFail(status = 500, body: object = { message: 'boom' }) {
      fixture.detectChanges();
      fillValid();
      component.submit({ invalid: false, submitted: true } as never);
      http.expectOne(MEDS_URL).flush(body, { status, statusText: 'Error' });
      fixture.detectChanges();
    }

    it('keeps the modal open and surfaces the error', () => {
      const closed = jasmine.createSpy('close');
      component.close.subscribe(closed);

      submitAndFail();

      expect(closed).not.toHaveBeenCalled();
      expect(component.error()).toBeTruthy();
      expect(fixture.nativeElement.textContent).toContain(component.error());
    });

    it('keeps what the user typed', () => {
      submitAndFail();

      expect(component.form.name).toBe('Metformin');
      expect(component.doseTimes).toEqual(['09:15']);
    });

    it('re-enables the Save button so the user can retry', () => {
      submitAndFail();
      expect(component.submitting()).toBeFalse();
    });

    it('shows the API message when there is one', () => {
      submitAndFail(422, {
        errors: [{ path: 'refillDate', message: 'refillDate must be a valid ISO date' }],
      });

      expect(component.error()).toContain('ISO date');
    });
  });

  describe('edit mode', () => {
    beforeEach(() => {
      component.editMed = existing;
      fixture.detectChanges();
    });

    it('loads the existing note', () => {
      // Was hardcoded to '', so an existing note could be neither seen nor cleared.
      expect(component.form.note).toBe('Take with food');
    });

    it('populates the form and dose times from the medication', () => {
      expect(component.form.name).toBe('Metformin');
      expect(component.doseTimes).toEqual(['08:00', '20:00']);
      expect(component.isEditMode).toBeTrue();
    });

    it('clamps pillsRemaining when pillsTotal is lowered below it', () => {
      component.form.pillsTotal = 20; // existing pillsRemaining is 50

      component.submit({ invalid: false, submitted: true } as never);

      const req = http.expectOne(`${MEDS_URL}/MED1`);
      expect(req.request.method).toBe('PATCH');
      expect(req.request.body.pillsRemaining).toBe(20);
      req.flush({ data: existing, traceId: 't' });
    });

    it('leaves pillsRemaining alone when the total still covers it', () => {
      component.form.pillsTotal = 90;

      component.submit({ invalid: false, submitted: true } as never);

      const req = http.expectOne(`${MEDS_URL}/MED1`);
      expect(req.request.body.pillsRemaining).toBe(50);
      req.flush({ data: existing, traceId: 't' });
    });

    it('sends an empty string so a note can be cleared', () => {
      component.form.note = '';

      component.submit({ invalid: false, submitted: true } as never);

      const req = http.expectOne(`${MEDS_URL}/MED1`);
      // undefined would be dropped from the JSON and the backend would skip it.
      expect(req.request.body.notes).toBe('');
      req.flush({ data: existing, traceId: 't' });
    });

    it('splits a weekly schedule back into day and time', () => {
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        imports: [AddMedicationModalComponent, HttpClientTestingModule],
      });
      const f = TestBed.createComponent(AddMedicationModalComponent);
      f.componentInstance.editMed = {
        ...existing,
        frequency: 'Weekly',
        schedule: ['Monday · 8:00 AM'],
      };
      f.detectChanges();

      expect(f.componentInstance.weeklyDay).toBe('Monday');
      expect(f.componentInstance.doseTimes).toEqual(['08:00']);
      http = TestBed.inject(HttpTestingController);
    });
  });

  describe('overlay dismiss', () => {
    it('closes on a backdrop click', () => {
      fixture.detectChanges();
      const closed = jasmine.createSpy('close');
      component.close.subscribe(closed);

      const el = document.createElement('div');
      component.onOverlayClick({ target: el, currentTarget: el } as unknown as MouseEvent);

      expect(closed).toHaveBeenCalled();
    });

    it('does not discard the form mid-submit', () => {
      fixture.detectChanges();
      fillValid();
      component.submit({ invalid: false, submitted: true } as never);

      const closed = jasmine.createSpy('close');
      component.close.subscribe(closed);
      const el = document.createElement('div');
      component.onOverlayClick({ target: el, currentTarget: el } as unknown as MouseEvent);

      expect(closed).not.toHaveBeenCalled();
      http.expectOne(MEDS_URL).flush({ data: existing, traceId: 't' });
    });
  });
});
