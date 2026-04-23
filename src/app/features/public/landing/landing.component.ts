import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

interface RoleCard {
  role: 'patient' | 'ngo' | 'hmo' | 'researcher';
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
      role: 'researcher',
      emoji: '🔬',
      label: 'Clinical Researcher',
      description: 'Post studies, recruit participants',
      signupRoute: '/auth/researcher/signup',
    },
  ];

  readonly features = [
    { emoji: '💊', title: 'Medication & Care Tracking', description: 'Reminders, appointments, health history' },
    { emoji: '💰', title: 'NGO Funding Access', description: 'Browse programs, apply, get matched' },
    { emoji: '📊', title: 'Longitudinal Health Profiles', description: 'HMO-managed care journey data' },
    { emoji: '🔬', title: 'Clinical Research', description: 'Study recruitment, participant matching' },
  ];
}
