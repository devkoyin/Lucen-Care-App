import { Component, inject } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../../core/auth/auth.service';
import { BenefactorApplicationsService } from '../../../../core/applications/benefactor-applications.service';
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
  private readonly auth   = inject(AuthService);
  private readonly apps   = inject(BenefactorApplicationsService);

  currentStep = 1;
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
    const user = this.auth.user();
    const v1   = this.step1Form.value;
    this.apps.submit({
      fullName:         v1.fullName!,
      email:            user?.email ?? '',
      phone:            v1.phone!,
      reasonForSupport: v1.reasonForSupport!,
      docs: [{ label: 'Government-issued ID', submitted: this.step2Form.value.idConsent === true }],
    });
    this.currentStep++;
  }
}
