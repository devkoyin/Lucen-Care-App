import { Component, inject } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../../core/auth/auth.service';
import { ProfessionalApplicationsService } from '../../../../core/applications/professional-applications.service';
import { OnboardingShellComponent } from '../onboarding-shell/onboarding-shell.component';
import { FormFieldComponent } from '../../../../shared/components/form-field/form-field.component';

@Component({
  selector: 'lc-professional-onboarding',
  standalone: true,
  imports: [ReactiveFormsModule, OnboardingShellComponent, FormFieldComponent],
  templateUrl: './professional-onboarding.component.html',
  styleUrl: './professional-onboarding.component.scss',
})
export class ProfessionalOnboardingComponent {
  private readonly fb     = inject(FormBuilder);
  private readonly auth   = inject(AuthService);
  private readonly apps   = inject(ProfessionalApplicationsService);
  private readonly router = inject(Router);

  currentStep = 1;
  readonly totalSteps = 4;
  readonly stepLabels = ['Professional info', 'Credentials', 'Terms & consent', 'Verification'];

  readonly step1Form = this.fb.group({
    profession: ['', Validators.required],
    licenseNumber: ['', Validators.required],
    specialty: ['', Validators.required],
    yearsOfExperience: ['', [Validators.required, Validators.min(0)]],
    phone: ['', Validators.required],
  });

  readonly step2Form = this.fb.group({
    bio: ['', Validators.required],
  });

  readonly step3Form = this.fb.group({
    termsConsent: [false, Validators.requiredTrue],
    codeOfConductConsent: [false, Validators.requiredTrue],
  });

  get currentForm(): FormGroup | null {
    if (this.currentStep === 1) return this.step1Form;
    if (this.currentStep === 2) return this.step2Form;
    if (this.currentStep === 3) return this.step3Form;
    return null;
  }

  get stepTitle(): string {
    const titles: Record<number, string> = {
      1: 'Tell us about your practice',
      2: 'Your credentials',
      3: 'Terms & code of conduct',
      4: 'Application submitted',
    };
    return titles[this.currentStep] ?? '';
  }

  get canContinue(): boolean {
    if (this.currentStep === 4) return true;
    return this.currentForm?.valid ?? true;
  }

  get continueLabel(): string {
    return this.currentStep === 4 ? 'Return to home' : 'Continue';
  }

  get fullName(): string {
    return this.auth.user()?.name ?? 'your account';
  }

  back(): void {
    if (this.currentStep > 1) this.currentStep--;
  }

  next(): void {
    if (this.currentStep === 4) {
      this.router.navigate(['/']);
      return;
    }
    const form = this.currentForm;
    form?.markAllAsTouched();
    if (form?.invalid) return;

    if (this.currentStep === 3) {
      const user = this.auth.user();
      const s1 = this.step1Form.value;
      const s2 = this.step2Form.value;
      this.apps.submit({
        fullName: user?.name ?? '',
        email: user?.email ?? '',
        phone: s1.phone ?? '',
        profession: (s1.profession as 'Doctor' | 'Nurse' | 'Therapist' | 'Other') ?? 'Other',
        licenseNumber: s1.licenseNumber ?? '',
        specialty: s1.specialty ?? '',
        yearsOfExperience: Number(s1.yearsOfExperience ?? 0),
        bio: s2.bio ?? '',
        docs: [
          { label: 'Medical License / Registration', submitted: !!s1.licenseNumber },
          { label: 'Specialty / Certification',       submitted: !!s1.specialty },
          { label: 'Practice Bio',                    submitted: !!s2.bio },
        ],
      });
    }

    this.currentStep++;
  }
}
