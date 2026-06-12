import { Component, inject } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';
import { FormFieldComponent } from '../../../shared/components/form-field/form-field.component';
import { LoginPayload } from '../../../core/auth/auth.models';

@Component({
  selector: 'lc-admin-login',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, FormFieldComponent],
  templateUrl: './admin-login.component.html',
  styleUrl: './admin-login.component.scss',
})
export class AdminLoginComponent {
  private readonly fb     = inject(FormBuilder);
  private readonly auth   = inject(AuthService);
  private readonly router = inject(Router);

  readonly form = this.fb.group({
    email:    ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
  });

  loading     = false;
  serverError = '';

  get emailError(): string {
    const ctrl = this.form.get('email')!;
    if (!ctrl.touched || ctrl.valid) return '';
    if (ctrl.hasError('required')) return 'Email is required';
    return 'Enter a valid email address';
  }

  get passwordError(): string {
    const ctrl = this.form.get('password')!;
    if (!ctrl.touched || ctrl.valid) return '';
    if (ctrl.hasError('required')) return 'Password is required';
    return 'Password must be at least 8 characters';
  }

  submit(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;

    this.loading     = true;
    this.serverError = '';

    this.auth.login('admin', this.form.getRawValue() as LoginPayload).subscribe({
      next: () => this.router.navigate(['/admin/dashboard']),
      error: (e: Error) => {
        this.loading     = false;
        this.serverError = e?.message ?? 'Something went wrong. Please try again.';
      },
    });
  }
}
