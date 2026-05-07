import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { signal } from '@angular/core';
import { PatientOnboardingComponent } from './patient-onboarding.component';
import { AuthService } from '../../../../core/auth/auth.service';
import { User } from '../../../../core/auth/auth.models';

describe('PatientOnboardingComponent', () => {
  let fixture: ComponentFixture<PatientOnboardingComponent>;
  let authSpy: jasmine.SpyObj<AuthService>;

  const mockUser: User = { id: '1', role: 'patient', name: 'Alice', email: 'a@b.com', status: 'active' };

  beforeEach(async () => {
    authSpy = jasmine.createSpyObj<AuthService>('AuthService', ['login', 'signup', 'signOut', 'isAuthenticated', 'role'], {
      user: signal(mockUser),
    });

    await TestBed.configureTestingModule({
      imports: [PatientOnboardingComponent],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: authSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(PatientOnboardingComponent);
    fixture.detectChanges();
  });

  it('creates', () => expect(fixture.componentInstance).toBeTruthy());
  it('starts on step 1', () => expect(fixture.componentInstance.currentStep).toBe(1));
  it('canContinue is true on step 1 (default accountType set)', () => expect(fixture.componentInstance.canContinue).toBeTrue());
  it('advances to step 2 on next()', () => { fixture.componentInstance.next(); expect(fixture.componentInstance.currentStep).toBe(2); });
  it('step 2 canContinue is false when fields empty', () => { fixture.componentInstance.currentStep = 2; expect(fixture.componentInstance.canContinue).toBeFalse(); });
  it('step 3 canContinue is false when terms not accepted', () => { fixture.componentInstance.currentStep = 3; expect(fixture.componentInstance.canContinue).toBeFalse(); });
  it('step 3 canContinue is true when terms accepted', () => {
    fixture.componentInstance.currentStep = 3;
    fixture.componentInstance.step3Form.get('termsConsent')!.setValue(true);
    expect(fixture.componentInstance.canContinue).toBeTrue();
  });
  it('back() decrements currentStep', () => { fixture.componentInstance.currentStep = 2; fixture.componentInstance.back(); expect(fixture.componentInstance.currentStep).toBe(1); });
  it('back() does not go below 1', () => { fixture.componentInstance.back(); expect(fixture.componentInstance.currentStep).toBe(1); });
  it('continueLabel is "Go to dashboard" on step 4', () => { fixture.componentInstance.currentStep = 4; expect(fixture.componentInstance.continueLabel).toBe('Go to dashboard'); });
  it('userName returns name from auth.user()', () => expect(fixture.componentInstance.userName).toBe('Alice'));
  it('stepTitle reflects currentStep', () => {
    expect(fixture.componentInstance.stepTitle).toBe('What describes you best?');
    fixture.componentInstance.currentStep = 4;
    expect(fixture.componentInstance.stepTitle).toBe("You're all set!");
  });
});
