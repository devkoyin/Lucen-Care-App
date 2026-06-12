import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { SidebarShellComponent, NavItem } from '../../shared/layout/sidebar-shell/sidebar-shell.component';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'lc-hmo-portal',
  standalone: true,
  imports: [SidebarShellComponent],
  template: `
    <lc-sidebar-shell
      portalLabel="HMO Portal"
      portalClass="portal-hmo"
      [userName]="userName"
      [userInitial]="userInitial"
      userRole="HMO"
      [navItems]="navItems"
      (signOut)="handleSignOut()">
    </lc-sidebar-shell>
  `,
})
export class HmoPortalComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly navItems: NavItem[] = [
    { icon: '🏠', label: 'Dashboard',  route: '/hmo/dashboard' },
    { icon: '✅', label: 'Pre-Auth',   route: '/hmo/pre-auth'  },
    { icon: '🧾', label: 'Claims',     route: '/hmo/claims'    },
    { icon: '👥', label: 'Members',    route: '/hmo/members'   },
    { icon: '🏥', label: 'Providers',  route: '/hmo/providers' },
  ];

  get userName(): string { return this.auth.user()?.name ?? 'User'; }
  get userInitial(): string { return this.auth.user()?.name?.[0]?.toUpperCase() ?? 'U'; }

  handleSignOut(): void {
    this.auth.signOut();
    this.router.navigate(['/']);
  }
}
