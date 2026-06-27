import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

@Component({
  selector: 'lc-medications',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './medications.component.html',
  styleUrl: './medications.component.scss',
})
export class MedicationsComponent {
  readonly stats = [
    { value: '5',   label: 'Active Meds',     icon: '💊' },
    { value: '4',   label: 'Taken Today',      icon: '✅' },
    { value: '2',   label: 'Due Today',        icon: '⏱️' },
    { value: '14d', label: 'Adherence Streak', icon: '🔥' },
  ];
}
