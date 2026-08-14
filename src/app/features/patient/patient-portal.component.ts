import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { SidebarShellComponent, NavItem } from '../../shared/layout/sidebar-shell/sidebar-shell.component';
import { AuthService } from '../../core/auth/auth.service';
import { MedicationNotificationService } from '../../core/notifications/medication-notification.service';
import { CommunityNavService } from '../community/community-nav.service';

@Component({
  selector: 'lc-patient-portal',
  standalone: true,
  imports: [SidebarShellComponent],
  template: `
    <lc-sidebar-shell
      portalLabel="Patient Portal"
      portalClass="portal-patient"
      [userName]="userName"
      [userInitial]="userInitial"
      userRole="Patient & Caregiver"
      [navItems]="navItems"
      settingsRoute="/patient/settings"
      (signOut)="handleSignOut()">
    </lc-sidebar-shell>
  `,
})
export class PatientPortalComponent {
  private readonly auth   = inject(AuthService);
  private readonly router = inject(Router);
  // The community feature is shared by three portals. Setting the base here rather
  // than only on the community route means links rendered OUTSIDE it — the
  // dashboard's thread lists — resolve under this role too.
  private readonly communityNav = inject(CommunityNavService);

  constructor() {
    this.communityNav.setBase('/patient/community');
  }
  private readonly medNotif = inject(MedicationNotificationService);

  readonly navItems: NavItem[] = [
    { icon: '🏠', label: 'Dashboard', route: '/patient/dashboard' },
    { icon: '💊', label: 'Medications', route: '/patient/medications' },
    { icon: '📅', label: 'Appointments', route: '/patient/appointments', liveIcon: 'calendar' },
    { icon: '🤖', label: 'AI Health Chat', route: '/patient/ai-chat' },
    { icon: '🤝', label: 'Community', route: '/patient/community' },
    { icon: '💰', label: 'Funding', route: '/patient/funding' },
    // Privacy and My Profile are account settings, not care workflow — they live
    // under Settings at the bottom of the sidebar.
  ];

  get userName(): string { return this.auth.user()?.name ?? 'User'; }
  get userInitial(): string { return this.auth.user()?.name?.[0]?.toUpperCase() ?? 'U'; }

  handleSignOut(): void {
    this.medNotif.unregister();
    this.auth.signOut();
    this.router.navigate(['/']);
  }
}
