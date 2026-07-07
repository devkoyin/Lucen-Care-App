import { Component, computed } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { SEED_PLANS, SEED_PRE_AUTHS, SEED_PROGRAMS } from './funding.data';

@Component({
  selector: 'lc-funding',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './funding.component.html',
  styleUrl: './funding.component.scss',
})
export class FundingComponent {
  readonly stats = [
    { value: '₦2.5M',                                                            label: 'Total coverage',     icon: '🛡️' },
    { value: String(SEED_PLANS.length),                                          label: 'Active plans',       icon: '📋' },
    { value: String(SEED_PRE_AUTHS.filter(p => p.status === 'Approved').length), label: 'Pre-auths approved', icon: '✅' },
    { value: String(SEED_PROGRAMS.filter(p => p.enrolled).length),               label: 'Aid programmes',     icon: '🤝' },
  ];
}
