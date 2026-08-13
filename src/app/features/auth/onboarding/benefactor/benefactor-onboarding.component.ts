import { Component, inject } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { BenefactorApplicationsService } from '../../../../core/applications/benefactor-applications.service';
import { apiErrorMessage } from '../../../../core/api/wrapped-response.model';
import { OnboardingShellComponent } from '../onboarding-shell/onboarding-shell.component';
import { FormFieldComponent } from '../../../../shared/components/form-field/form-field.component';

@Component({
  selector: 'lc-benefactor-onboarding',
  standalone: true,
  imports: [ReactiveFormsModule, OnboardingShellComponent, FormFieldComponent],
  templateUrl: './benefactor-onboarding.component.html',
  styleUrl: './benefactor-onboarding.component.scss',
})
export class BenefactorOnboardingComponent {
  private readonly fb     = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly apps   = inject(BenefactorApplicationsService);

  currentStep = 1;
  submitting = false;
  serverError = '';

  readonly totalSteps = 4;
  readonly stepLabels = ['Personal details', 'Identity verification', 'Terms & consent', 'Verification'];

  readonly step1Form = this.fb.group({
    fullName:         ['', Validators.required],
    phone:            ['', Validators.required],
    reasonForSupport: ['', [Validators.required, Validators.minLength(20)]],
  });

  readonly step2Form = this.fb.group({
    idConsent: [false, Validators.requiredTrue],
  });

  readonly step3Form = this.fb.group({
    termsConsent:         [false, Validators.requiredTrue],
    codeOfConductConsent: [false, Validators.requiredTrue],
  });

  get fullName(): string { return this.step1Form.value.fullName ?? ''; }

  get stepTitle(): string {
    const titles: Record<number, string> = {
      1: 'Personal details',
      2: 'Identity verification',
      3: 'Terms & consent',
      4: 'Verification pending',
    };
    return titles[this.currentStep] ?? '';
  }

  get canContinue(): boolean {
    if (this.currentStep === 4) return true;
    if (this.currentStep === 1) return this.step1Form.valid;
    if (this.currentStep === 2) return this.step2Form.valid;
    if (this.currentStep === 3) return this.step3Form.valid;
    return false;
  }

  get continueLabel(): string {
    if (this.currentStep === 4) return 'Return to home';
    return 'Continue';
  }

  back(): void {
    if (this.currentStep > 1) this.currentStep--;
  }

  next(): void {
    if (!this.canContinue) return;
    if (this.currentStep === 4) {
      this.router.navigate(['/']);
      return;
    }
    if (this.currentStep === 3) {
      this.submitApplication();
      return;
    }
    this.currentStep++;
  }

  private submitApplication(): void {
    const v1 = this.step1Form.value;
    const v2 = this.step2Form.value;
    const v3 = this.step3Form.value;

    this.submitting = true;
    this.serverError = '';

    this.apps.submitToApi({
      fullName:         v1.fullName ?? '',
      phone:            v1.phone ?? '',
      reasonForSupport: v1.reasonForSupport ?? '',
      idConsent:            v2.idConsent            ?? false,
      termsConsent:         v3.termsConsent         ?? false,
      codeOfConductConsent: v3.codeOfConductConsent ?? false,
    }).subscribe({
      next: () => {
        this.submitting = false;
        this.currentStep++;
      },
      error: (e: { status?: number }) => {
        this.submitting = false;
        // 409 means an application already exists for this user — the submission
        // succeeded on an earlier attempt, so show the pending step.
        if (e?.status === 409) {
          this.currentStep++;
          return;
        }
        this.serverError = apiErrorMessage(e);
      },
    });
  }
}
