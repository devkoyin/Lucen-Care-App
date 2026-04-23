import { Component, Input } from '@angular/core';
import { NgClass } from '@angular/common';

type BadgeColor = 'success' | 'warning' | 'error' | 'neutral' | 'role';
const BADGE_COLORS = new Set<BadgeColor>(['success', 'warning', 'error', 'neutral', 'role']);

@Component({
  selector: 'lc-badge',
  standalone: true,
  imports: [NgClass],
  template: `<span [ngClass]="'badge badge--' + color" role="status" [attr.aria-label]="ariaLabel || null"><ng-content /></span>`,
  styleUrl: './badge.component.scss',
})
export class BadgeComponent {
  @Input() set color(val: BadgeColor) {
    this._color = BADGE_COLORS.has(val) ? val : 'neutral';
  }
  get color(): BadgeColor { return this._color; }
  private _color: BadgeColor = 'success';

  @Input() ariaLabel?: string;
}
