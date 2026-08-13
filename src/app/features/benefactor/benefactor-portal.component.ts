import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { SidebarShellComponent, NavItem } from '../../shared/layout/sidebar-shell/sidebar-shell.component';
import { AuthService } from '../../core/auth/auth.service';
import { CommunityNavService } from '../community/community-nav.service';

const NAV_ITEMS: NavItem[] = [
  { icon: '🏠', label: 'Dashboard',  route: '/benefactor/dashboard' },
  { icon: '🤝', label: 'Community',  route: '/benefactor/community' },
  { icon: '💛', label: 'My Profile', route: '/benefactor/profile' },
];

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
      [userRole]="userRole"
      [navItems]="navItems()"
      (signOut)="handleSignOut()">
    </lc-sidebar-shell>
  `,
})
export class BenefactorPortalComponent {
  private readonly auth   = inject(AuthService);
  private readonly router = inject(Router);
  // The community feature is shared by three portals. Setting the base here rather
  // than only on the community route means links rendered OUTSIDE it — the
  // dashboard's thread lists — resolve under this role too.
  private readonly communityNav = inject(CommunityNavService);

  constructor() {
    this.communityNav.setBase('/benefactor/community');
  }

  private readonly me = toSignal(this.auth.me().pipe(catchError(() => of(null))), {
    initialValue: null,
  });

  // Empty until the account is verified, so a pending user is not shown links that
  // verifiedGuard would bounce straight back to the pending screen.
  readonly navItems = computed<NavItem[]>(() =>
    this.me()?.status === 'active' ? NAV_ITEMS : [],
  );

  get userRole(): string { return this.me()?.status === 'active' ? 'Verified Benefactor' : 'Benefactor'; }

  get userName(): string    { return this.auth.user()?.name ?? 'User'; }
  get userInitial(): string { return this.auth.user()?.name?.[0]?.toUpperCase() ?? 'U'; }

  handleSignOut(): void {
    this.auth.signOut();
    this.router.navigate(['/']);
  }
}
