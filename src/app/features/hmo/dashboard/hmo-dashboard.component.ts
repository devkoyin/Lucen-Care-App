import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';

interface PreAuthRow {
  patient: string;
  initial: string;
  procedure: string;
  doctor: string;
  hospital: string;
  date: string;
  status: 'Pending' | 'Under Review';
}

interface ClaimRow {
  id: string;
  hospital: string;
  patient: string;
  description: string;
  amount: number;
  date: string;
  status: 'Pending' | 'Queried';
}

interface HighUtilMember {
  name: string;
  initial: string;
  plan: string;
  utilisation: number;
  limit: number;
  conditions: string;
}

@Component({
  selector: 'lc-hmo-dashboard',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './hmo-dashboard.component.html',
  styleUrl: './hmo-dashboard.component.scss',
})
export class HmoDashboardComponent {
  private readonly auth = inject(AuthService);
  get orgName(): string { return this.auth.user()?.name ?? 'Hygeia HMO'; }

  readonly stats = [
    { icon: '⏳', label: 'Pre-auths pending',    value: '23',     route: '/hmo/pre-auth', warn: true  },
    { icon: '🧾', label: 'Claims this month',     value: '₦184M',  route: '/hmo/claims',   warn: false },
    { icon: '👥', label: 'Active members',         value: '12,847', route: '/hmo/members',  warn: false },
    { icon: '🏥', label: 'Accredited providers',   value: '156',    route: '/hmo/providers',warn: false },
  ];

  readonly pendingPreAuths: PreAuthRow[] = [
    { patient: 'Adaeze M.',  initial: 'A', procedure: 'Echocardiogram',         doctor: 'Dr. James Obi',    hospital: 'Reddington',   date: '3 Jun 2026',  status: 'Pending'      },
    { patient: 'Emeka O.',   initial: 'E', procedure: 'Physiotherapy × 10',     doctor: 'Dr. Sarah Chen',   hospital: 'Lagoon VI',    date: '1 Jun 2026',  status: 'Under Review' },
    { patient: 'Bisi L.',    initial: 'B', procedure: 'Upper GI Endoscopy',      doctor: 'Dr. Amina Bello',  hospital: 'EKO Hospital', date: '3 Jun 2026',  status: 'Pending'      },
  ];

  readonly pendingClaims: ClaimRow[] = [
    { id: 'CLM-8821', hospital: 'Reddington',  patient: 'Emeka O.',  description: 'Cardiology consultation',  amount: 35000, date: '14 May 2026', status: 'Pending' },
    { id: 'CLM-8816', hospital: 'LUTH',        patient: 'Chioma A.', description: 'Metformin 500mg × 90',     amount: 8400,  date: '1 Apr 2026',  status: 'Queried' },
  ];

  readonly highUtilMembers: HighUtilMember[] = [
    { name: 'Ngozi E.',  initial: 'N', plan: 'Standard',      utilisation: 104700, limit: 1000000, conditions: 'Hypertension, Anxiety'           },
    { name: 'Emeka O.',  initial: 'E', plan: 'Comprehensive', utilisation: 71500,  limit: 2000000, conditions: 'Hypertension'                    },
    { name: 'Adaeze M.', initial: 'A', plan: 'Comprehensive', utilisation: 61300,  limit: 2000000, conditions: 'Hypertension, Diabetes'           },
    { name: 'Chioma A.', initial: 'C', plan: 'Comprehensive', utilisation: 48200,  limit: 2000000, conditions: 'Diabetes'                        },
  ];

  utilisationPct(used: number, limit: number): number {
    return Math.round((used / limit) * 100);
  }

  utilisationColor(pct: number): string {
    if (pct >= 80) return '#DC2626';
    if (pct >= 50) return '#D97706';
    return '#059669';
  }

  formatAmount(n: number): string {
    return '₦' + n.toLocaleString('en-NG');
  }

  preAuthStatusColor(s: string): string {
    return s === 'Pending' ? '#D97706' : '#2563EB';
  }
}
