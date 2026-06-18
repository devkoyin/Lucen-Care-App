import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { BenefactorOnboardingComponent } from './benefactor-onboarding.component';

describe('BenefactorOnboardingComponent', () => {
  let fixture: ComponentFixture<BenefactorOnboardingComponent>;
  let component: BenefactorOnboardingComponent;

  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [BenefactorOnboardingComponent],
      providers: [provideRouter([])],
    }).compileComponents();
    fixture = TestBed.createComponent(BenefactorOnboardingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('creates', () => expect(component).toBeTruthy());

  it('starts on step 1', () => expect(component.currentStep).toBe(1));

  it('canContinue is false when step 1 is empty', () => {
    expect(component.canContinue).toBeFalse();
  });

  it('canContinue is true when step 1 is valid', () => {
    component.step1Form.setValue({
      fullName: 'Ada Obi', phone: '0800', reasonForSupport: 'I want to support patient communities',
    });
    expect(component.canContinue).toBeTrue();
  });

  it('next() advances step when step 1 is valid', () => {
    component.step1Form.setValue({
      fullName: 'Ada Obi', phone: '0800', reasonForSupport: 'I want to support patient communities',
    });
    component.next();
    expect(component.currentStep).toBe(2);
  });

  it('next() does not advance when step 1 is invalid', () => {
    component.next();
    expect(component.currentStep).toBe(1);
  });

  it('back() decrements step', () => {
    component.currentStep = 2;
    component.back();
    expect(component.currentStep).toBe(1);
  });

  it('continueLabel is "Continue" on step 1', () => {
    expect(component.continueLabel).toBe('Continue');
  });

  it('stepTitle reflects current step', () => {
    expect(component.stepTitle).toBe('Personal details');
    component.currentStep = 2;
    expect(component.stepTitle).toBe('Identity verification');
  });
});
