import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { signal } from '@angular/core';
import { NgoOnboardingComponent } from './ngo-onboarding.component';
import { AuthService } from '../../../../core/auth/auth.service';
import { User } from '../../../../core/auth/auth.models';

describe('NgoOnboardingComponent', () => {
  let fixture: ComponentFixture<NgoOnboardingComponent>;
  let authSpy: jasmine.SpyObj<AuthService>;

  const mockUser: User = { id: '1', role: 'ngo', name: 'Org Admin', email: 'admin@ngo.org', status: 'pending' };

  beforeEach(async () => {
    authSpy = jasmine.createSpyObj<AuthService>('AuthService', ['login', 'signup', 'signOut', 'isAuthenticated', 'role'], {
      user: signal(mockUser),
    });

    await TestBed.configureTestingModule({
      imports: [NgoOnboardingComponent],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: authSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(NgoOnboardingComponent);
    fixture.detectChanges();
  });

  it('creates', () => expect(fixture.componentInstance).toBeTruthy());
  it('starts on step 1', () => expect(fixture.componentInstance.currentStep).toBe(1));
  it('step 1 canContinue is false when fields empty', () => expect(fixture.componentInstance.canContinue).toBeFalse());
  it('advances step on next() when form valid', () => {
    fixture.componentInstance.step1Form.setValue({ orgName: 'Help Org', registrationNumber: 'RC123', focusAreas: 'HIV', website: '' });
    fixture.componentInstance.next();
    expect(fixture.componentInstance.currentStep).toBe(2);
  });
  it('does not advance when form invalid', () => {
    fixture.componentInstance.next();
    expect(fixture.componentInstance.currentStep).toBe(1);
  });
  it('back() decrements step', () => { fixture.componentInstance.currentStep = 2; fixture.componentInstance.back(); expect(fixture.componentInstance.currentStep).toBe(1); });
  it('continueLabel is "Return to home" on step 4', () => { fixture.componentInstance.currentStep = 4; expect(fixture.componentInstance.continueLabel).toBe('Return to home'); });
  it('stepTitle reflects currentStep', () => {
    expect(fixture.componentInstance.stepTitle).toBe('Tell us about your organisation');
    fixture.componentInstance.currentStep = 4;
    expect(fixture.componentInstance.stepTitle).toBe('Application submitted');
  });
});
