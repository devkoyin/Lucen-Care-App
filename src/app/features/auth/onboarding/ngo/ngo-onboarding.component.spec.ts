import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { signal } from '@angular/core';
import { NgoOnboardingComponent } from './ngo-onboarding.component';
import { AuthService } from '../../../../core/auth/auth.service';
import { User } from '../../../../core/auth/auth.models';
import { environment } from '../../../../../environments/environment';

const ONBOARD_URL = `${environment.apiUrl}/auth/onboarding/ngo`;

describe('NgoOnboardingComponent', () => {
  let fixture: ComponentFixture<NgoOnboardingComponent>;
  let component: NgoOnboardingComponent;
  let http: HttpTestingController;

  const mockUser: User = { id: '1', role: 'ngo', name: 'Org Admin', email: 'admin@ngo.org', status: 'pending' };

  beforeEach(async () => {
    const authSpy = jasmine.createSpyObj<AuthService>(
      'AuthService',
      ['login', 'signup', 'signOut', 'isAuthenticated', 'role'],
      { user: signal(mockUser) },
    );

    await TestBed.configureTestingModule({
      imports: [NgoOnboardingComponent, HttpClientTestingModule],
      providers: [provideRouter([]), { provide: AuthService, useValue: authSpy }],
    }).compileComponents();

    fixture = TestBed.createComponent(NgoOnboardingComponent);
    component = fixture.componentInstance;
    http = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
  });

  afterEach(() => http.verify());

  /** Fills steps 1–3 and parks the wizard on the consent step. */
  function fillAllSteps(overrides: { website?: string } = {}) {
    component.step1Form.setValue({
      orgName: 'Help Org',
      registrationNumber: 'RC123',
      tin: '01234567-0001',
      scumlNumber: 'SCUML-998877',
      focusAreas: 'HIV',
      website: overrides.website ?? 'https://helporg.example',
    });
    component.step2Form.setValue({
      operatingRegions: 'Lagos',
      headOfficeCountry: 'NG',
      programDescription: 'Community outreach',
    });
    component.step3Form.setValue({ termsConsent: true, dataProcessingConsent: true });
    component.currentStep = 3;
  }

  it('creates', () => expect(component).toBeTruthy());
  it('starts on step 1', () => expect(component.currentStep).toBe(1));
  it('step 1 canContinue is false when fields empty', () => expect(component.canContinue).toBeFalse());

  it('advances step on next() when form valid', () => {
    component.step1Form.setValue({
      orgName: 'Help Org', registrationNumber: 'RC123', tin: '01234567-0001',
      scumlNumber: 'SCUML-998877', focusAreas: 'HIV', website: '',
    });
    component.next();
    expect(component.currentStep).toBe(2);
  });

  it('does not advance when form invalid', () => {
    component.next();
    expect(component.currentStep).toBe(1);
  });

  it('back() decrements step', () => {
    component.currentStep = 2;
    component.back();
    expect(component.currentStep).toBe(1);
  });

  it('continueLabel is "Return to home" on step 4', () => {
    component.currentStep = 4;
    expect(component.continueLabel).toBe('Return to home');
  });

  it('stepTitle reflects currentStep', () => {
    expect(component.stepTitle).toBe('Tell us about your organisation');
    component.currentStep = 4;
    expect(component.stepTitle).toBe('Application submitted');
  });

  // The wizard previously built a payload and never subscribed, so no request
  // was ever made and the user was stranded on step 3.
  it('submits every collected field on the consent step', () => {
    fillAllSteps();
    component.next();

    const req = http.expectOne(ONBOARD_URL);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({
      orgName: 'Help Org',
      registrationNumber: 'RC123',
      tin: '01234567-0001',
      scumlNumber: 'SCUML-998877',
      focusAreas: 'HIV',
      website: 'https://helporg.example',
      operatingRegions: 'Lagos',
      headOfficeCountry: 'NG',
      programDescription: 'Community outreach',
      termsConsent: true,
      dataProcessingConsent: true,
    });
    req.flush({ data: { id: 'ORG1' }, traceId: 't' });

    expect(component.currentStep).toBe(4);
  });

  // The API validates website with @IsUrl(); @IsOptional only skips null/undefined,
  // so an empty string would come back as a 422.
  it('omits website entirely when left blank', () => {
    fillAllSteps({ website: '' });
    component.next();

    const req = http.expectOne(ONBOARD_URL);
    expect('website' in (req.request.body as object)).toBeFalse();
    req.flush({ data: {}, traceId: 't' });
  });

  it('never sends a docs field — forbidNonWhitelisted would reject it', () => {
    fillAllSteps();
    component.next();

    const req = http.expectOne(ONBOARD_URL);
    expect('docs' in (req.request.body as object)).toBeFalse();
    req.flush({ data: {}, traceId: 't' });
  });

  it('surfaces a server validation error instead of advancing', () => {
    fillAllSteps();
    component.next();

    http.expectOne(ONBOARD_URL).flush(
      { errors: [{ path: 'tin', message: 'tin should not be empty' }], message: 'Validation failed' },
      { status: 422, statusText: 'Unprocessable Entity' },
    );

    expect(component.currentStep).toBe(3);
    expect(component.serverError).toBe('tin should not be empty');
    expect(component.submitting).toBeFalse();
  });
});
