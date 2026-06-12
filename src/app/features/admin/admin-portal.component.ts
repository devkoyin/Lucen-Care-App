import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { SidebarShellComponent, NavItem } from '../../shared/layout/sidebar-shell/sidebar-shell.component';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'lc-admin-portal',
  standalone: true,
  imports: [SidebarShellComponent],
  template: `
    <lc-sidebar-shell
      portalLabel="Admin Portal"
      portalClass="portal-admin"
      [userName]="userName"
      [userInitial]="userInitial"
      userRole="Admin"
      [navItems]="navItems"
      (signOut)="handleSignOut()">
    </lc-sidebar-shell>
  `,
})
export class AdminPortalComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly navItems: NavItem[] = [
    { icon: '🏠', label: 'Dashboard',      route: '/admin/dashboard' },
    { icon: '🏢', label: 'NGO Approvals',  route: '/admin/ngo-approvals' },
    { icon: '🏥', label: 'HMO Approvals',  route: '/admin/hmo-approvals' },
    { icon: '📋', label: 'Audit Log',      route: '/admin/audit-log' },
  ];

  get userName(): string    { return this.auth.user()?.name ?? 'Admin'; }
  get userInitial(): string { return this.auth.user()?.name?.[0]?.toUpperCase() ?? 'A'; }

  handleSignOut(): void {
    this.auth.signOut();
    this.router.navigate(['/admin/login']);
  }
}
