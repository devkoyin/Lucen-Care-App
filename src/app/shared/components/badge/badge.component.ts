import { Component, Input } from '@angular/core';
import { NgClass } from '@angular/common';

@Component({
  selector: 'lc-badge',
  standalone: true,
  imports: [NgClass],
  template: `<span [ngClass]="'badge badge--' + color"><ng-content /></span>`,
  styleUrl: './badge.component.scss',
})
export class BadgeComponent {
  @Input() color: 'success' | 'warning' | 'error' | 'neutral' | 'role' = 'success';
}
