import { Component, Input, Output, EventEmitter, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { NgClass } from '@angular/common';
import { CalendarIconComponent } from '../../components/calendar-icon/calendar-icon.component';

export interface NavItem {
  icon: string;
  label: string;
  route: string;
  liveIcon?: 'calendar';
}

@Component({
  selector: 'lc-sidebar-shell',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, NgClass, CalendarIconComponent],
  templateUrl: './sidebar-shell.component.html',
  styleUrl: './sidebar-shell.component.scss',
})
export class SidebarShellComponent {
  @Input() portalLabel = '';
  @Input() portalClass = '';
  @Input() userName = '';
  @Input() userInitial = '';
  @Input() userRole = '';
  @Input() navItems: NavItem[] = [];
  /**
   * Empty hides the link entirely. A portal with no settings modules — or a user
   * whose account is not yet verified — would otherwise be offered a link that
   * resolves nowhere, or that verifiedGuard bounces straight back.
   */
  @Input() settingsRoute = '';
  @Output() signOut = new EventEmitter<void>();

  readonly menuOpen = signal(false);

  toggleMenu(): void { this.menuOpen.update(v => !v); }
  closeMenu(): void  { this.menuOpen.set(false); }

  /**
   * Tapping the page closes the mobile menu. Declared `void` on purpose — an
   * expression that returns false in a template listener makes Angular call
   * preventDefault(), which would kill every click in the routed page.
   */
  handleMainClick(): void {
    if (this.menuOpen()) this.closeMenu();
  }
}
