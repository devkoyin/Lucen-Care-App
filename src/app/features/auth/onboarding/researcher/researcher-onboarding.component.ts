import { Component, inject } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../../core/auth/auth.service';
import { OnboardingShellComponent } from '../onboarding-shell/onboarding-shell.component';
import { FormFieldComponent } from '../../../../shared/components/form-field/form-field.component';

@Component({
  selector: 'lc-researcher-onboarding',
  standalone: true,
  imports: [ReactiveFormsModule, OnboardingShellComponent, FormFieldComponent],
  templateUrl: './researcher-onboarding.component.html',
  styleUrl: './researcher-onboarding.component.scss',
})
export class ResearcherOnboardingComponent {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  currentStep = 1;
  readonly totalSteps = 4;
  readonly stepLabels = ['Professional details', 'Research focus', 'Ethics & consent', 'Verification'];

  readonly step1Form = this.fb.group({
    title: ['', Validators.required],
    institution: ['', Validators.required],
    department: [''],
    orcidId: [''],
  });

  readonly step2Form = this.fb.group({
    researchAreas: ['', Validators.required],
    irbAffiliation: [''],
    irbNumber: [''],
  });

  readonly step3Form = this.fb.group({
    disclaimerAcknowledgement: [false, Validators.requiredTrue],
    termsConsent: [false, Validators.requiredTrue],
  });

  get currentForm(): FormGroup | null {
    if (this.currentStep === 1) return this.step1Form;
    if (this.currentStep === 2) return this.step2Form;
    if (this.currentStep === 3) return this.step3Form;
    return null;
  }

  get stepTitle(): string {
    const titles: Record<number, string> = {
      1: 'Your professional background',
      2: 'Research focus',
      3: 'Ethics & platform terms',
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

  get userName(): string {
    return this.auth.user()?.name ?? 'Researcher';
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
    this.currentStep++;
  }
}
