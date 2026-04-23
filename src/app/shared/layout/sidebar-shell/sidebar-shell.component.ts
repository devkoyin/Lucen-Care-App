import { Component, Input, Output, EventEmitter } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { NgClass } from '@angular/common';

export interface NavItem {
  icon: string;
  label: string;
  route: string;
}

@Component({
  selector: 'lc-sidebar-shell',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, NgClass],
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
  @Output() signOut = new EventEmitter<void>();
}
