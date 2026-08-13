import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { SidebarShellComponent, NavItem } from '../../shared/layout/sidebar-shell/sidebar-shell.component';
import { AuthService } from '../../core/auth/auth.service';

const NAV_ITEMS: NavItem[] = [
  { icon: '🏠', label: 'Dashboard',  route: '/hmo/dashboard' },
  { icon: '✅', label: 'Pre-Auth',   route: '/hmo/pre-auth'  },
  { icon: '🧾', label: 'Claims',     route: '/hmo/claims'    },
  { icon: '👥', label: 'Members',    route: '/hmo/members'   },
  { icon: '🏥', label: 'Providers',  route: '/hmo/providers' },
];

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
      [navItems]="navItems()"
      (signOut)="handleSignOut()">
    </lc-sidebar-shell>
  `,
})
export class HmoPortalComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  private readonly me = toSignal(this.auth.me().pipe(catchError(() => of(null))), {
    initialValue: null,
  });

  // Empty until the account is verified, so a pending user is not shown links that
  // verifiedGuard would bounce straight back to the pending screen.
  readonly navItems = computed<NavItem[]>(() =>
    this.me()?.status === 'active' ? NAV_ITEMS : [],
  );

  get userName(): string { return this.auth.user()?.name ?? 'User'; }
  get userInitial(): string { return this.auth.user()?.name?.[0]?.toUpperCase() ?? 'U'; }

  handleSignOut(): void {
    this.auth.signOut();
    this.router.navigate(['/']);
  }
}
