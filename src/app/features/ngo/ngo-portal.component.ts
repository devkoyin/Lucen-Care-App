import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { SidebarShellComponent, NavItem } from '../../shared/layout/sidebar-shell/sidebar-shell.component';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'lc-ngo-portal',
  standalone: true,
  imports: [SidebarShellComponent],
  template: `
    <lc-sidebar-shell
      portalLabel="NGO Portal"
      portalClass="portal-ngo"
      [userName]="userName"
      [userInitial]="userInitial"
      userRole="NGO"
      [navItems]="navItems"
      (signOut)="handleSignOut()">
    </lc-sidebar-shell>
  `,
})
export class NgoPortalComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly navItems: NavItem[] = [
    { icon: '🏠', label: 'Dashboard', route: '/ngo/dashboard' },
    { icon: '📋', label: 'Programs', route: '/ngo/programs' },
    { icon: '👥', label: 'Applicants', route: '/ngo/applicants' },
    { icon: '🗺️', label: 'Patient Map', route: '/ngo/map' },
    { icon: '🔔', label: 'Notifications', route: '/ngo/notifications' },
  ];

  get userName(): string { return this.auth.user()?.name ?? 'User'; }
  get userInitial(): string { return this.auth.user()?.name?.[0]?.toUpperCase() ?? 'U'; }

  handleSignOut(): void {
    this.auth.signOut();
    this.router.navigate(['/']);
  }
}
