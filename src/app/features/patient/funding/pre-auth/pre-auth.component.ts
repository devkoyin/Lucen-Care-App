import { Component, computed, signal } from '@angular/core';
import { PreAuthRequest, PreAuthStatus, SEED_PRE_AUTHS } from '../funding.data';

@Component({
  selector: 'lc-pre-auth',
  standalone: true,
  imports: [],
  templateUrl: './pre-auth.component.html',
  styleUrl: './pre-auth.component.scss',
})
export class PreAuthComponent {
  readonly requests = signal<PreAuthRequest[]>(SEED_PRE_AUTHS);

  readonly approvedCount   = computed(() => this.requests().filter(r => r.status === 'Approved').length);
  readonly underReviewCount = computed(() => this.requests().filter(r => r.status === 'Under Review').length);
  readonly pendingCount    = computed(() => this.requests().filter(r => r.status === 'Pending').length);

  statusColor(s: PreAuthStatus): string {
    return s === 'Approved' ? '#059669' : s === 'Under Review' ? '#2563EB' : '#D97706';
  }
}
