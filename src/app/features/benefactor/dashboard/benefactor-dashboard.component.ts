import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';
import { BEN_STATS, BEN_IMPACT } from '../benefactor.data';

@Component({
  selector: 'lc-benefactor-dashboard',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './benefactor-dashboard.component.html',
  styleUrl: './benefactor-dashboard.component.scss',
})
export class BenefactorDashboardComponent {
  private readonly auth = inject(AuthService);

  get displayName(): string { return this.auth.user()?.name ?? 'Benefactor'; }

  readonly stats  = BEN_STATS;
  readonly impact = BEN_IMPACT;
}
