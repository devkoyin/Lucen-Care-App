import { Component, Input } from '@angular/core';

@Component({
  selector: 'lc-card',
  standalone: true,
  imports: [],
  template: `
    <div class="card" [class.card--bordered]="bordered">
      <ng-content />
    </div>
  `,
  styleUrl: './card.component.scss',
})
export class CardComponent {
  @Input() bordered = false;
}
