import { Component, Input } from '@angular/core';
import { NgClass } from '@angular/common';

@Component({
  selector: 'lc-card',
  standalone: true,
  imports: [NgClass],
  template: `
    <div [ngClass]="['card', bordered ? 'card--bordered' : '']">
      <ng-content />
    </div>
  `,
  styleUrl: './card.component.scss',
})
export class CardComponent {
  @Input() bordered = false;
}
