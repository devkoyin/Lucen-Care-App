import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { SidebarShellComponent, NavItem } from '../../shared/layout/sidebar-shell/sidebar-shell.component';
import { AuthService } from '../../core/auth/auth.service';

const NAV_ITEMS: NavItem[] = [
  { icon: '🏠', label: 'Dashboard', route: '/ngo/dashboard' },
  { icon: '📋', label: 'Programs', route: '/ngo/programs' },
  { icon: '👥', label: 'Applicants', route: '/ngo/applicants' },
  { icon: '🗺️', label: 'Patient Map', route: '/ngo/map' },
  { icon: '🔔', label: 'Notifications', route: '/ngo/notifications' },
];

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
      [navItems]="navItems()"
      [settingsRoute]="settingsRoute()"
      (signOut)="handleSignOut()">
    </lc-sidebar-shell>
  `,
})
export class NgoPortalComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  private readonly me = toSignal(this.auth.me().pipe(catchError(() => of(null))), {
    initialValue: null,
  });

  // Empty until the organisation is verified, so a pending user is not shown links
  // that verifiedGuard would bounce straight back to /ngo/pending.
  readonly navItems = computed<NavItem[]>(() =>
    this.me()?.status === 'active' ? NAV_ITEMS : [],
  );

  /** Empty hides the link — same reason the nav above is empty while pending. */
  readonly settingsRoute = computed(() =>
    this.me()?.status === 'active' ? '/ngo/settings' : '',
  );

  get userName(): string { return this.auth.user()?.name ?? 'User'; }
  get userInitial(): string { return this.auth.user()?.name?.[0]?.toUpperCase() ?? 'U'; }

  handleSignOut(): void {
    this.auth.signOut();
    // Same target roleGuard redirects an unauthenticated visitor to.
    this.router.navigate(['/auth', 'ngo', 'login']);
  }
}
