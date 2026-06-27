import { Component, output } from '@angular/core';

@Component({
  selector: 'lc-guidelines-modal',
  standalone: true,
  templateUrl: './guidelines-modal.component.html',
  styleUrl: './guidelines-modal.component.scss',
})
export class GuidelinesModalComponent {
  readonly close = output<void>();
}
