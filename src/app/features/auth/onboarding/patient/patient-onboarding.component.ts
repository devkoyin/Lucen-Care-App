import { Component, inject } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../../core/auth/auth.service';
import { OnboardingShellComponent } from '../onboarding-shell/onboarding-shell.component';
import { FormFieldComponent } from '../../../../shared/components/form-field/form-field.component';
import { NIGERIA_STATES } from '../../../../core/geo/nigeria';

@Component({
  selector: 'lc-patient-onboarding',
  standalone: true,
  imports: [ReactiveFormsModule, OnboardingShellComponent, FormFieldComponent],
  templateUrl: './patient-onboarding.component.html',
  styleUrl: './patient-onboarding.component.scss',
})
export class PatientOnboardingComponent {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  loading = false;
  serverError = '';

  currentStep = 1;
  readonly totalSteps = 4;
  readonly stepLabels = ['Account type', 'Health profile', 'Privacy & consent', 'Welcome'];

  readonly step1Form = this.fb.group({
    accountType: ['patient' as 'patient' | 'caregiver', Validators.required],
  });

  readonly step2Form = this.fb.group({
    dateOfBirth: ['', Validators.required],
    biologicalSex: ['', Validators.required],
    country: ['', Validators.required],
    // Optional by design: the state list is Nigeria-shaped, and a patient elsewhere
    // must still be able to finish onboarding.
    locationState: [''],
    conditions: [''],
    primaryLanguage: ['', Validators.required],
  });

  readonly states = NIGERIA_STATES;

  /** The state list only makes sense for Nigeria; other countries skip it. */
  get showState(): boolean {
    return this.step2Form.controls.country.value === 'NG';
  }

  readonly step3Form = this.fb.group({
    termsConsent: [false, Validators.requiredTrue],
    ngoConsent: [false],
    researchConsent: [false],
  });

  get currentForm(): FormGroup | null {
    if (this.currentStep === 1) return this.step1Form;
    if (this.currentStep === 2) return this.step2Form;
    if (this.currentStep === 3) return this.step3Form;
    return null;
  }

  get stepTitle(): string {
    const titles: Record<number, string> = {
      1: 'What describes you best?',
      2: 'Tell us about yourself',
      3: 'Your privacy, your choice',
      4: "You're all set!",
    };
    return titles[this.currentStep] ?? '';
  }

  get canContinue(): boolean {
    if (this.currentStep === 4) return true;
    return this.currentForm?.valid ?? true;
  }

  get continueLabel(): string {
    return this.currentStep === 4 ? 'Go to dashboard' : 'Continue';
  }

  get userName(): string {
    return this.auth.user()?.name ?? 'there';
  }

  back(): void {
    if (this.currentStep > 1) this.currentStep--;
  }

  next(): void {
    if (this.currentStep === 4) {
      this.router.navigate(['/patient/dashboard']);
      return;
    }
    const form = this.currentForm;
    form?.markAllAsTouched();
    if (form?.invalid) return;

    if (this.currentStep === 3) {
      this.submitOnboarding();
      return;
    }

    this.currentStep++;
  }

  private submitOnboarding(): void {
    const s1 = this.step1Form.value;
    const s2 = this.step2Form.value;
    const s3 = this.step3Form.value;

    this.loading = true;
    this.serverError = '';

    this.auth.submitPatientOnboarding({
      accountType: s1.accountType ?? '',
      dateOfBirth: s2.dateOfBirth ?? '',
      biologicalSex: s2.biologicalSex ?? '',
      country: s2.country ?? '',
      // Absent rather than empty: forbidNonWhitelisted is fine with a missing
      // optional key, but an empty string would be stored as a real location.
      ...(s2.locationState ? { locationState: s2.locationState } : {}),
      conditions: s2.conditions ?? '',
      primaryLanguage: s2.primaryLanguage ?? '',
      termsConsent: s3.termsConsent ?? false,
      ngoConsent: s3.ngoConsent ?? false,
      researchConsent: s3.researchConsent ?? false,
    }).subscribe({
      next: () => {
        this.loading = false;
        this.currentStep++;
      },
      error: (e: { error?: { message?: string; errors?: Array<{ message: string }> } }) => {
        this.loading = false;
        const firstError = e?.error?.errors?.[0]?.message;
        this.serverError = firstError ?? e?.error?.message ?? 'Something went wrong. Please try again.';
      },
    });
  }
}
