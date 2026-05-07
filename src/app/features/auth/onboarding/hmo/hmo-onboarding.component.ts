import { Component, inject } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../../core/auth/auth.service';
import { OnboardingShellComponent } from '../onboarding-shell/onboarding-shell.component';
import { FormFieldComponent } from '../../../../shared/components/form-field/form-field.component';

@Component({
  selector: 'lc-hmo-onboarding',
  standalone: true,
  imports: [ReactiveFormsModule, OnboardingShellComponent, FormFieldComponent],
  templateUrl: './hmo-onboarding.component.html',
  styleUrl: './hmo-onboarding.component.scss',
})
export class HmoOnboardingComponent {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  currentStep = 1;
  readonly totalSteps = 4;
  readonly stepLabels = ['Organisation', 'Coverage area', 'BAA & consent', 'Verification'];

  readonly step1Form = this.fb.group({
    orgName: ['', Validators.required],
    licenceNumber: ['', Validators.required],
    contactPhone: ['', Validators.required],
  });

  readonly step2Form = this.fb.group({
    coverageRegion: ['', Validators.required],
    enrolledPatientCount: ['', Validators.required],
    specialtyFocus: [''],
  });

  readonly step3Form = this.fb.group({
    baaAcknowledgement: [false, Validators.requiredTrue],
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
      1: 'Your organisation details',
      2: 'Coverage & patient scope',
      3: 'BAA & terms',
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

  get orgName(): string {
    return this.step1Form.get('orgName')?.value ?? 'your organisation';
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
