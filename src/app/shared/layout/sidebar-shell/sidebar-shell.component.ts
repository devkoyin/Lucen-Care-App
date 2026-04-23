import { Component, Input } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

export interface NavItem {
  icon: string;
  label: string;
  route: string;
}

@Component({
  selector: 'lc-sidebar-shell',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
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
}
