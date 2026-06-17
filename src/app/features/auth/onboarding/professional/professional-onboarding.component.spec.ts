import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { signal } from '@angular/core';
import { ProfessionalOnboardingComponent } from './professional-onboarding.component';
import { AuthService } from '../../../../core/auth/auth.service';
import { User } from '../../../../core/auth/auth.models';

describe('ProfessionalOnboardingComponent', () => {
  let fixture: ComponentFixture<ProfessionalOnboardingComponent>;

  const mockUser: User = { id: '1', role: 'professional', name: 'Dr. Jane Doe', email: 'jane@doe.com', status: 'pending' };

  beforeEach(async () => {
    const authSpy = jasmine.createSpyObj<AuthService>('AuthService', ['login', 'signup', 'signOut', 'isAuthenticated', 'role'], {
      user: signal(mockUser),
    });

    await TestBed.configureTestingModule({
      imports: [ProfessionalOnboardingComponent],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: authSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ProfessionalOnboardingComponent);
    fixture.detectChanges();
  });

  it('creates', () => expect(fixture.componentInstance).toBeTruthy());
  it('starts on step 1', () => expect(fixture.componentInstance.currentStep).toBe(1));
  it('step 1 canContinue is false when fields empty', () => expect(fixture.componentInstance.canContinue).toBeFalse());

  it('advances step on next() when form valid', () => {
    fixture.componentInstance.step1Form.setValue({
      profession: 'Doctor', licenseNumber: 'LIC-1', specialty: 'Cardiology', yearsOfExperience: '5', phone: '0800000000',
    });
    fixture.componentInstance.next();
    expect(fixture.componentInstance.currentStep).toBe(2);
  });

  it('does not advance when form invalid', () => {
    fixture.componentInstance.next();
    expect(fixture.componentInstance.currentStep).toBe(1);
  });

  it('back() decrements step', () => {
    fixture.componentInstance.currentStep = 2;
    fixture.componentInstance.back();
    expect(fixture.componentInstance.currentStep).toBe(1);
  });

  it('continueLabel is "Return to home" on step 4', () => {
    fixture.componentInstance.currentStep = 4;
    expect(fixture.componentInstance.continueLabel).toBe('Return to home');
  });

  it('stepTitle reflects currentStep', () => {
    expect(fixture.componentInstance.stepTitle).toBe('Tell us about your practice');
    fixture.componentInstance.currentStep = 4;
    expect(fixture.componentInstance.stepTitle).toBe('Application submitted');
  });
});
