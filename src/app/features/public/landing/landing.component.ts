import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

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
export class LandingComponent {
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
    {
      role: 'hmo',
      emoji: '🏦',
      label: 'HMO',
      description: 'Build & manage longitudinal care profiles',
      signupRoute: '/auth/hmo/signup',
    },
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
