import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PRO_IMPACT } from '../../professional.data';

@Component({
  selector: 'lc-pro-impact',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './impact.component.html',
  styleUrl: './impact.component.scss',
})
export class ProImpactComponent {
  readonly impact = PRO_IMPACT;

  readonly highlights = [
    { icon: '🩺', text: '2,400+ patients reached through your community posts and answers' },
    { icon: '✅', text: '47 patient questions answered — one of the top contributors this month' },
    { icon: '⚡', text: 'Average 3.2 hr response time keeps you among the fastest responders' },
    { icon: '⭐', text: '96% helpful rating from patients across all your community activity' },
  ];
}
