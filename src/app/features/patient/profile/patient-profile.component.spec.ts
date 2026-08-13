import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';

import { PatientProfileComponent } from './patient-profile.component';
import { environment } from '../../../../environments/environment';

const PROFILE = `${environment.apiUrl}/patients/me`;

function profile(over: Record<string, unknown> = {}) {
  return {
    id: '01PATIENT00000000000000001',
    userId: '01USER0000000000000000001',
    name: 'Amina Bello',
    phone: '+2348012345678',
    dateOfBirth: '1990-04-12',
    address: '12 Allen Avenue',
    locationState: '',
    locationLga: '',
    conditionTags: ['Diabetes'],
    directContactShared: false,
    isCaregiver: false,
    ...over,
  };
}

describe('PatientProfileComponent', () => {
  let fixture: ComponentFixture<PatientProfileComponent>;
  let component: PatientProfileComponent;
  let http: HttpTestingController;

  beforeEach(async () => {
    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [PatientProfileComponent, HttpClientTestingModule],
    }).compileComponents();

    fixture = TestBed.createComponent(PatientProfileComponent);
    component = fixture.componentInstance;
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  function init(over: Record<string, unknown> = {}) {
    fixture.detectChanges();
    http.expectOne(PROFILE).flush({ data: profile(over), traceId: 't' });
    fixture.detectChanges();
  }

  it('fills the form from the API', () => {
    init();

    expect(component.form.controls.name.value).toBe('Amina Bello');
    expect(component.form.controls.dateOfBirth.value).toBe('1990-04-12');
  });

  it('shows an error with retry when the profile cannot be loaded', () => {
    fixture.detectChanges();
    http.expectOne(PROFILE).flush({}, { status: 500, statusText: 'Error' });
    fixture.detectChanges();

    expect(component.loadError()).toBeTrue();
    expect(fixture.nativeElement.textContent).toContain('Could not load your profile');
  });

  // The reason this screen exists: patients who onboarded before location was
  // collected had no way to fill it in.
  it('sends only the fields that changed', () => {
    init();
    component.form.controls.locationState.setValue('Lagos');

    component.save();

    const req = http.expectOne(PROFILE);
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual({ locationState: 'Lagos' });
    req.flush({ data: profile({ locationState: 'Lagos' }), traceId: 't' });

    expect(component.saved()).toBeTrue();
  });

  // An empty dateOfBirth would 422, and an empty phone would collide on the unique index.
  it('treats a cleared optional field as "leave it alone"', () => {
    init();
    component.form.controls.phone.setValue('');
    component.form.controls.dateOfBirth.setValue('');
    component.form.controls.locationLga.setValue('Ikeja');

    component.save();

    const req = http.expectOne(PROFILE);
    expect(req.request.body).toEqual({ locationLga: 'Ikeja' });
    req.flush({ data: profile({ locationLga: 'Ikeja' }), traceId: 't' });
  });

  it('reports the API reason when saving fails', () => {
    init();
    component.form.controls.locationState.setValue('Lagos');

    component.save();

    http.expectOne(PROFILE).flush(
      { status: 422, message: 'locationState must be shorter than 80 characters' },
      { status: 422, statusText: 'Unprocessable Entity' },
    );
    fixture.detectChanges();

    expect(component.saveError()).toContain('80 characters');
    expect(component.saved()).toBeFalse();
  });

  it('will not submit without a name', () => {
    init();
    component.form.controls.name.setValue('');

    component.save();

    http.expectNone(r => r.method === 'PATCH');
  });
});
