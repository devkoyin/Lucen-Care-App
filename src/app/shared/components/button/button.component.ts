import { Component, Input } from '@angular/core';
import { NgClass } from '@angular/common';

@Component({
  selector: 'lc-button',
  standalone: true,
  imports: [NgClass],
  template: `
    <button
      [ngClass]="'btn btn--' + variant"
      [disabled]="disabled"
      [type]="type"
      [attr.aria-label]="ariaLabel || null"
    >
      <ng-content />
    </button>
  `,
  styleUrl: './button.component.scss',
})
export class ButtonComponent {
  @Input() variant: 'primary' | 'secondary' | 'accent' = 'primary';
  @Input() disabled = false;
  @Input() type: 'button' | 'submit' | 'reset' = 'button';
  @Input() ariaLabel?: string;
}
