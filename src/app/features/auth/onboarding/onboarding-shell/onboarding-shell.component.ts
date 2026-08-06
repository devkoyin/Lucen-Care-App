import { Component, EventEmitter, Input, Output } from '@angular/core';
import { NgClass } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Role } from '../../../../core/auth/auth.models';

@Component({
  selector: 'lc-onboarding-shell',
  standalone: true,
  imports: [NgClass, RouterLink],
  templateUrl: './onboarding-shell.component.html',
  styleUrl: './onboarding-shell.component.scss',
})
export class OnboardingShellComponent {
  @Input({ required: true }) currentStep = 1;
  @Input({ required: true }) totalSteps = 4;
  @Input() stepLabels: string[] = [];
  @Input() stepTitle = '';
  @Input() canContinue = true;
  @Input() continueLabel = 'Continue';
  @Input() role: Role = 'patient';
  /** Server-side failure message for the current step. Empty string hides the banner. */
  @Input() serverError = '';
  /** True while a submit is in flight — blocks double submission. */
  @Input() submitting = false;
  @Output() back = new EventEmitter<void>();
  @Output() continue = new EventEmitter<void>();

  get progress(): number {
    return Math.round(((this.currentStep - 1) / this.totalSteps) * 100);
  }
}
