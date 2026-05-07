import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { SidebarShellComponent, NavItem } from '../../shared/layout/sidebar-shell/sidebar-shell.component';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'lc-researcher-portal',
  standalone: true,
  imports: [SidebarShellComponent],
  template: `
    <lc-sidebar-shell
      portalLabel="Research Portal"
      portalClass="portal-researcher"
      [userName]="userName"
      [userInitial]="userInitial"
      userRole="Clinical Researcher"
      [navItems]="navItems"
      (signOut)="handleSignOut()">
    </lc-sidebar-shell>
  `,
})
export class ResearcherPortalComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly navItems: NavItem[] = [
    { icon: '🏠', label: 'Dashboard', route: '/researcher/dashboard' },
    { icon: '🔬', label: 'Studies', route: '/researcher/studies' },
    { icon: '👥', label: 'Participants', route: '/researcher/participants' },
    { icon: '📢', label: 'Recruitment', route: '/researcher/recruitment' },
    { icon: '🔔', label: 'Notifications', route: '/researcher/notifications' },
  ];

  get userName(): string { return this.auth.user()?.name ?? 'User'; }
  get userInitial(): string { return this.auth.user()?.name?.[0]?.toUpperCase() ?? 'U'; }

  handleSignOut(): void {
    this.auth.signOut();
    this.router.navigate(['/']);
  }
}
