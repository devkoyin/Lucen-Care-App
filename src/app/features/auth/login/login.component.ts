import { Component, Input, OnInit, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { NgClass } from '@angular/common';
import { AuthService } from '../../../core/auth/auth.service';
import { FormFieldComponent } from '../../../shared/components/form-field/form-field.component';
import { LoginPayload, Role } from '../../../core/auth/auth.models';

const ROLE_LABELS: Record<string, string> = {
  patient: 'Patient & Caregiver',
  ngo: 'NGO',
  hmo: 'HMO',
  admin: 'Admin',
};

const ROLES: { id: Role; label: string; emoji: string }[] = [
  { id: 'patient', label: 'Patient', emoji: '🏥' },
  { id: 'ngo',     label: 'NGO',     emoji: '🤝' },
  { id: 'hmo',     label: 'HMO',     emoji: '🏛' },
];

@Component({
  selector: 'lc-login',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, NgClass, FormFieldComponent],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent implements OnInit {
  @Input() role: Role = 'patient';

  private readonly fb   = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly roles = ROLES;
  readonly selectedRole = signal<Role>('patient');

  readonly form = this.fb.group({
    email:    ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
  });

  loading     = false;
  serverError = '';

  ngOnInit(): void {
    this.selectedRole.set(this.role);
  }

  get roleName(): string {
    return ROLE_LABELS[this.selectedRole()] ?? this.selectedRole();
  }

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

  selectRole(role: Role): void {
    this.selectedRole.set(role);
    this.serverError = '';
  }

  submit(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;
    this.loading     = true;
    this.serverError = '';
    const role = this.selectedRole();
    this.auth.login(role, this.form.getRawValue() as LoginPayload).subscribe({
      next: () => this.router.navigate(['/', role, 'dashboard']),
      error: (e: { error?: { message?: string } }) => {
        this.loading = false;
        this.serverError = e?.error?.message ?? 'Something went wrong. Please try again.';
      },
    });
  }
}
