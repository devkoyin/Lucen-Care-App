import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { PlatformStats, PublicStatsService } from '../../../core/public/public-stats.service';

/**
 * Admin is deliberately absent: the portal is internal, reached only by typing
 * /admin/login, and must not be advertised on a public page.
 */
interface RoleCard {
  role: 'patient' | 'ngo' | 'hmo' | 'professional' | 'benefactor';
  emoji: string;
  label: string;
  description: string;
  signupRoute: string;
}

@Component({
  selector: 'lc-landing',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './landing.component.html',
  styleUrl: './landing.component.scss',
})
export class LandingComponent implements OnInit {
  private readonly publicStats = inject(PublicStatsService);

  /**
   * Three states, not two. `null` while the request is in flight renders the
   * skeleton; `failed` hides the row outright rather than showing a number the
   * platform cannot stand behind.
   */
  readonly stats = signal<PlatformStats | null>(null);
  readonly statsFailed = signal(false);

  ngOnInit(): void {
    this.publicStats.getStats().subscribe({
      next: s => this.stats.set(s),
      error: () => this.statsFailed.set(true),
    });
  }

  /**
   * The tiles have always read "2,400+". Keeping the suffix on a live count
   * means the copy does not change shape as the platform grows.
   */
  formatCount(value: number): string {
    return `${value.toLocaleString('en-NG')}+`;
  }

  readonly roleCards: RoleCard[] = [
    {
      role: 'patient',
      emoji: '🏥',
      label: 'Patient & Caregiver',
      description: 'Track health, access funding & support',
      signupRoute: '/auth/patient/signup',
    },
    {
      role: 'ngo',
      emoji: '🤝',
      label: 'NGO',
      description: 'Post programs, select & map patients',
      signupRoute: '/auth/ngo/signup',
    },
    // TEMPORARILY HIDDEN — restore alongside the HMO sign-in role in
    // features/auth/login/login.component.ts.
    // {
    //   role: 'hmo',
    //   emoji: '🏦',
    //   label: 'HMO',
    //   description: 'Build & manage longitudinal care profiles',
    //   signupRoute: '/auth/hmo/signup',
    // },
    {
      role: 'professional',
      emoji: '⚕️',
      label: 'Healthcare Professional',
      description: 'Join patient communities as a verified volunteer',
      signupRoute: '/auth/professional/signup',
    },
    {
      role: 'benefactor',
      emoji: '💛',
      label: 'Benefactor',
      description: 'Support patients through individual funding & community',
      signupRoute: '/auth/benefactor/signup',
    },
  ];
}
