import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { OnboardingShellComponent } from './onboarding-shell.component';

describe('OnboardingShellComponent', () => {
  let fixture: ComponentFixture<OnboardingShellComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OnboardingShellComponent],
      providers: [provideRouter([])],
    }).compileComponents();
    fixture = TestBed.createComponent(OnboardingShellComponent);
    fixture.componentInstance.currentStep = 1;
    fixture.componentInstance.totalSteps = 4;
    fixture.componentInstance.stepLabels = ['Account type', 'Health profile', 'Privacy', 'Welcome'];
    fixture.componentInstance.stepTitle = 'What describes you best?';
    fixture.componentInstance.role = 'patient';
    fixture.detectChanges();
  });

  it('creates', () => expect(fixture.componentInstance).toBeTruthy());

  it('renders step title', () => {
    const title = fixture.nativeElement.querySelector('.onboarding__step-title');
    expect(title.textContent.trim()).toBe('What describes you best?');
  });

  it('shows step number label', () => {
    const num = fixture.nativeElement.querySelector('.onboarding__step-num');
    expect(num.textContent.trim()).toBe('Step 1 of 4');
  });

  it('renders all step labels in sidebar', () => {
    const items = fixture.nativeElement.querySelectorAll('.step-list__item');
    expect(items.length).toBe(4);
  });

  it('marks first step as active', () => {
    const items = fixture.nativeElement.querySelectorAll('.step-list__item');
    expect(items[0].classList).toContain('step-list__item--active');
  });

  it('marks completed steps as done when currentStep advances', () => {
    fixture.componentInstance.currentStep = 3;
    fixture.detectChanges();
    const items = fixture.nativeElement.querySelectorAll('.step-list__item');
    expect(items[0].classList).toContain('step-list__item--done');
    expect(items[1].classList).toContain('step-list__item--done');
    expect(items[2].classList).toContain('step-list__item--active');
  });

  it('computes progress correctly', () => {
    fixture.componentInstance.currentStep = 2;
    fixture.detectChanges();
    expect(fixture.componentInstance.progress).toBe(25);
  });

  it('hides back button on step 1', () => {
    expect(fixture.nativeElement.querySelector('.onboarding__back-btn')).toBeNull();
  });

  it('shows back button on step 2+', () => {
    fixture.componentInstance.currentStep = 2;
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.onboarding__back-btn')).toBeTruthy();
  });

  it('emits back event on back button click', () => {
    fixture.componentInstance.currentStep = 2;
    fixture.detectChanges();
    let emitted = false;
    fixture.componentInstance.back.subscribe(() => emitted = true);
    fixture.nativeElement.querySelector('.onboarding__back-btn').click();
    expect(emitted).toBeTrue();
  });

  it('emits continue event on continue button click', () => {
    let emitted = false;
    fixture.componentInstance.continue.subscribe(() => emitted = true);
    fixture.nativeElement.querySelector('.onboarding__continue-btn').click();
    expect(emitted).toBeTrue();
  });

  it('applies portal class for role accent', () => {
    const el = fixture.nativeElement.querySelector('.onboarding');
    expect(el.classList).toContain('portal-patient');
  });
});
