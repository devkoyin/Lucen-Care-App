import { Component, inject } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ApplicationsService } from '../../../../core/applications/applications.service';
import { apiErrorMessage } from '../../../../core/api/wrapped-response.model';
import { OnboardingShellComponent } from '../onboarding-shell/onboarding-shell.component';
import { FormFieldComponent } from '../../../../shared/components/form-field/form-field.component';

@Component({
  selector: 'lc-ngo-onboarding',
  standalone: true,
  imports: [ReactiveFormsModule, OnboardingShellComponent, FormFieldComponent],
  templateUrl: './ngo-onboarding.component.html',
  styleUrl: './ngo-onboarding.component.scss',
})
export class NgoOnboardingComponent {
  private readonly fb   = inject(FormBuilder);
  private readonly apps = inject(ApplicationsService);
  private readonly router = inject(Router);

  currentStep = 1;
  submitting = false;
  serverError = '';

  readonly totalSteps = 4;
  readonly stepLabels = ['Organisation', 'Geographic scope', 'Terms & consent', 'Verification'];

  readonly step1Form = this.fb.group({
    orgName: ['', Validators.required],
    registrationNumber: ['', Validators.required],
    tin: ['', Validators.required],
    scumlNumber: ['', Validators.required],
    focusAreas: ['', Validators.required],
    website: [''],
  });

  readonly step2Form = this.fb.group({
    operatingRegions: ['', Validators.required],
    headOfficeCountry: ['', Validators.required],
    programDescription: ['', Validators.required],
  });

  readonly step3Form = this.fb.group({
    termsConsent: [false, Validators.requiredTrue],
    dataProcessingConsent: [false, Validators.requiredTrue],
  });

  get currentForm(): FormGroup | null {
    if (this.currentStep === 1) return this.step1Form;
    if (this.currentStep === 2) return this.step2Form;
    if (this.currentStep === 3) return this.step3Form;
    return null;
  }

  get stepTitle(): string {
    const titles: Record<number, string> = {
      1: 'Tell us about your organisation',
      2: 'Where do you operate?',
      3: 'Terms & data agreement',
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

    this.submitting = true;
    this.serverError = '';

    const website = s1.website?.trim();

    this.apps.submitNgoToApi({
      orgName:            s1.orgName            ?? '',
      registrationNumber: s1.registrationNumber ?? '',
      tin:                s1.tin                ?? '',
      scumlNumber:        s1.scumlNumber        ?? '',
      focusAreas:         s1.focusAreas         ?? '',
      // Omit the key entirely rather than send '' — the API validates website
      // with @IsUrl(), and @IsOptional() only skips null/undefined.
      ...(website ? { website } : {}),
      operatingRegions:   s2.operatingRegions   ?? '',
      headOfficeCountry:  s2.headOfficeCountry  ?? '',
      programDescription: s2.programDescription ?? '',
      termsConsent:          s3.termsConsent          ?? false,
      dataProcessingConsent: s3.dataProcessingConsent ?? false,
    }).subscribe({
      next: () => {
        this.submitting = false;
        this.currentStep++;
      },
      error: (e: unknown) => {
        this.submitting = false;
        this.serverError = apiErrorMessage(e);
      },
    });
  }
}
