import { Component, Input, inject } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { NgClass } from '@angular/common';
import { AuthService } from '../../../core/auth/auth.service';
import { FormFieldComponent } from '../../../shared/components/form-field/form-field.component';
import { SignupPayload, Role } from '../../../core/auth/auth.models';

const ROLE_LABELS: Record<string, string> = {
  patient: 'Patient & Caregiver',
  ngo: 'NGO',
  hmo: 'HMO',
  professional: 'Healthcare Professional',
  benefactor: 'Benefactor',
};

function passwordMatch(control: AbstractControl): ValidationErrors | null {
  const password = control.get('password')?.value;
  const confirm = control.get('confirmPassword')?.value;
  return password && confirm && password !== confirm ? { passwordMismatch: true } : null;
}

@Component({
  selector: 'lc-signup',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, NgClass, FormFieldComponent],
  templateUrl: './signup.component.html',
  styleUrl: './signup.component.scss',
})
export class SignupComponent {
  @Input() role: Role = 'patient';

  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly form = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
    confirmPassword: ['', Validators.required],
  }, { validators: passwordMatch });

  loading = false;
  serverError = '';

  get roleName(): string {
    return ROLE_LABELS[this.role] ?? this.role;
  }

  fieldError(field: string): string {
    const ctrl = this.form.get(field)!;
    if (!ctrl.touched || ctrl.valid) return '';
    if (ctrl.hasError('required')) return `${this.fieldLabel(field)} is required`;
    if (ctrl.hasError('minlength') && field === 'name') return 'Name must be at least 2 characters';
    if (ctrl.hasError('minlength') && field === 'password') return 'Password must be at least 8 characters';
    if (ctrl.hasError('email')) return 'Enter a valid email address';
    return '';
  }

  get confirmPasswordError(): string {
    const ctrl = this.form.get('confirmPassword')!;
    if (!ctrl.touched) return '';
    if (ctrl.hasError('required')) return 'Please confirm your password';
    if (this.form.hasError('passwordMismatch')) return 'Passwords do not match';
    return '';
  }

  private fieldLabel(field: string): string {
    const labels: Record<string, string> = { name: 'Full name', email: 'Email', password: 'Password', confirmPassword: 'Password confirmation' };
    return labels[field] ?? field;
  }

  submit(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;
    this.loading = true;
    this.serverError = '';
    const { name, email, password } = this.form.getRawValue();
    this.auth.signup(this.role, { name: name!, email: email!, password: password! } as SignupPayload).subscribe({
      next: () => this.router.navigate(['/auth/onboarding', this.role]),
      error: (e: { error?: { message?: string } }) => {
        this.loading = false;
        this.serverError = e?.error?.message ?? 'Something went wrong. Please try again.';
      },
    });
  }
}
