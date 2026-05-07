import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { signal } from '@angular/core';
import { HmoOnboardingComponent } from './hmo-onboarding.component';
import { AuthService } from '../../../../core/auth/auth.service';
import { User } from '../../../../core/auth/auth.models';

describe('HmoOnboardingComponent', () => {
  let fixture: ComponentFixture<HmoOnboardingComponent>;
  let authSpy: jasmine.SpyObj<AuthService>;

  const mockUser: User = { id: '1', role: 'hmo', name: 'HMO Admin', email: 'admin@hmo.com', status: 'pending' };

  beforeEach(async () => {
    authSpy = jasmine.createSpyObj<AuthService>('AuthService', ['login', 'signup', 'signOut', 'isAuthenticated', 'role'], {
      user: signal(mockUser),
    });

    await TestBed.configureTestingModule({
      imports: [HmoOnboardingComponent],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: authSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(HmoOnboardingComponent);
    fixture.detectChanges();
  });

  it('creates', () => expect(fixture.componentInstance).toBeTruthy());
  it('starts on step 1', () => expect(fixture.componentInstance.currentStep).toBe(1));
  it('step 1 canContinue false when empty', () => expect(fixture.componentInstance.canContinue).toBeFalse());
  it('advances when step 1 form is valid', () => {
    fixture.componentInstance.step1Form.setValue({ orgName: 'HealthCo', licenceNumber: 'LIC123', contactPhone: '+2348000000' });
    fixture.componentInstance.next();
    expect(fixture.componentInstance.currentStep).toBe(2);
  });
  it('step 3 canContinue false until both checkboxes checked', () => {
    fixture.componentInstance.currentStep = 3;
    expect(fixture.componentInstance.canContinue).toBeFalse();
    fixture.componentInstance.step3Form.setValue({ baaAcknowledgement: true, termsConsent: true });
    expect(fixture.componentInstance.canContinue).toBeTrue();
  });
  it('back() decrements step', () => { fixture.componentInstance.currentStep = 2; fixture.componentInstance.back(); expect(fixture.componentInstance.currentStep).toBe(1); });
  it('continueLabel is "Return to home" on step 4', () => { fixture.componentInstance.currentStep = 4; expect(fixture.componentInstance.continueLabel).toBe('Return to home'); });
  it('stepTitle reflects step', () => {
    expect(fixture.componentInstance.stepTitle).toBe('Your organisation details');
    fixture.componentInstance.currentStep = 3;
    expect(fixture.componentInstance.stepTitle).toBe('BAA & terms');
  });
});
