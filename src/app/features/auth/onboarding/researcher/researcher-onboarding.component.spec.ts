import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { signal } from '@angular/core';
import { ResearcherOnboardingComponent } from './researcher-onboarding.component';
import { AuthService } from '../../../../core/auth/auth.service';
import { User } from '../../../../core/auth/auth.models';

describe('ResearcherOnboardingComponent', () => {
  let fixture: ComponentFixture<ResearcherOnboardingComponent>;
  let authSpy: jasmine.SpyObj<AuthService>;

  const mockUser: User = { id: '1', role: 'researcher', name: 'Dr. Smith', email: 'smith@uni.edu', status: 'pending' };

  beforeEach(async () => {
    authSpy = jasmine.createSpyObj<AuthService>('AuthService', ['login', 'signup', 'signOut', 'isAuthenticated', 'role'], {
      user: signal(mockUser),
    });

    await TestBed.configureTestingModule({
      imports: [ResearcherOnboardingComponent],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: authSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ResearcherOnboardingComponent);
    fixture.detectChanges();
  });

  it('creates', () => expect(fixture.componentInstance).toBeTruthy());
  it('starts on step 1', () => expect(fixture.componentInstance.currentStep).toBe(1));
  it('step 1 canContinue false when empty', () => expect(fixture.componentInstance.canContinue).toBeFalse());
  it('advances when step 1 form is valid', () => {
    fixture.componentInstance.step1Form.setValue({ title: 'Dr.', institution: 'MIT', department: '', orcidId: '' });
    fixture.componentInstance.next();
    expect(fixture.componentInstance.currentStep).toBe(2);
  });
  it('step 2 canContinue false when researchAreas empty', () => {
    fixture.componentInstance.currentStep = 2;
    expect(fixture.componentInstance.canContinue).toBeFalse();
  });
  it('step 3 canContinue false until both checked', () => {
    fixture.componentInstance.currentStep = 3;
    expect(fixture.componentInstance.canContinue).toBeFalse();
    fixture.componentInstance.step3Form.setValue({ disclaimerAcknowledgement: true, termsConsent: true });
    expect(fixture.componentInstance.canContinue).toBeTrue();
  });
  it('back() decrements step', () => { fixture.componentInstance.currentStep = 2; fixture.componentInstance.back(); expect(fixture.componentInstance.currentStep).toBe(1); });
  it('continueLabel is "Return to home" on step 4', () => { fixture.componentInstance.currentStep = 4; expect(fixture.componentInstance.continueLabel).toBe('Return to home'); });
  it('userName returns name from auth.user()', () => expect(fixture.componentInstance.userName).toBe('Dr. Smith'));
  it('stepTitle changes per step', () => {
    expect(fixture.componentInstance.stepTitle).toBe('Your professional background');
    fixture.componentInstance.currentStep = 3;
    expect(fixture.componentInstance.stepTitle).toBe('Ethics & platform terms');
  });
});
