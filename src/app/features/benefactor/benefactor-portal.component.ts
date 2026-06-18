import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { SidebarShellComponent, NavItem } from '../../shared/layout/sidebar-shell/sidebar-shell.component';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'lc-benefactor-portal',
  standalone: true,
  imports: [SidebarShellComponent],
  template: `
    <lc-sidebar-shell
      portalLabel="Benefactor Portal"
      portalClass="portal-benefactor"
      [userName]="userName"
      [userInitial]="userInitial"
      userRole="Verified Benefactor"
      [navItems]="navItems"
      (signOut)="handleSignOut()">
    </lc-sidebar-shell>
  `,
})
export class BenefactorPortalComponent {
  private readonly auth   = inject(AuthService);
  private readonly router = inject(Router);

  readonly navItems: NavItem[] = [
    { icon: '🏠', label: 'Dashboard',  route: '/benefactor/dashboard' },
    { icon: '🤝', label: 'Community',  route: '/benefactor/community' },
    { icon: '💛', label: 'My Profile', route: '/benefactor/profile' },
  ];

  get userName(): string    { return this.auth.user()?.name ?? 'User'; }
  get userInitial(): string { return this.auth.user()?.name?.[0]?.toUpperCase() ?? 'U'; }

  handleSignOut(): void {
    this.auth.signOut();
    this.router.navigate(['/']);
  }
}
