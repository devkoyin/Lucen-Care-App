import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

type Role = 'patient' | 'ngo' | 'hmo' | 'admin' | 'professional';

interface RoleOption {
  id: Role;
  emoji: string;
  label: string;
  description: string;
}

@Component({
  selector: 'lc-role-selection',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './role-selection.component.html',
  styleUrl: './role-selection.component.scss',
})
export class RoleSelectionComponent {
  private readonly router = inject(Router);

  readonly roles: RoleOption[] = [
    { id: 'patient',      emoji: '🏥', label: 'Patient & Caregiver',      description: 'Health tracking, support & funding access' },
    { id: 'ngo',          emoji: '🤝', label: 'NGO',                      description: 'Funding programs & patient matching' },
    { id: 'hmo',          emoji: '🏦', label: 'HMO',                      description: 'Longitudinal care management' },
    { id: 'professional', emoji: '⚕️', label: 'Healthcare Professional', description: 'Verified volunteer support in patient communities' },
    { id: 'admin',        emoji: '🛡️', label: 'Admin',                   description: 'Approve & manage organisation accounts' },
  ];

  selectedRole: Role | null = null;

  get ctaLabel(): string {
    if (!this.selectedRole) return 'Select a role to continue';
    const role = this.roles.find(r => r.id === this.selectedRole)!;
    return `Continue as ${role.label} →`;
  }

  selectRole(role: Role): void {
    this.selectedRole = role;
  }

  continue(): void {
    if (!this.selectedRole) return;
    if (this.selectedRole === 'admin') {
      this.router.navigate(['/admin']);
    } else {
      this.router.navigate(['/auth', this.selectedRole, 'signup']);
    }
  }
}
