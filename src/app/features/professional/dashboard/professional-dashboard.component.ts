import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';
import { PRO_STATS, PRO_IMPACT } from '../professional.data';

@Component({
  selector: 'lc-professional-dashboard',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './professional-dashboard.component.html',
  styleUrl: './professional-dashboard.component.scss',
})
export class ProfessionalDashboardComponent {
  private readonly auth = inject(AuthService);

  get displayName(): string { return this.auth.user()?.name ?? 'Doctor'; }

  readonly stats  = PRO_STATS;
  readonly impact = PRO_IMPACT;
}
