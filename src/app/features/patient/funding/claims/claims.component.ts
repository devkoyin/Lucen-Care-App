import { Component, computed, signal } from '@angular/core';
import { ClaimStatus, ProviderClaim, SEED_CLAIMS } from '../funding.data';

@Component({
  selector: 'lc-treatment-claims',
  standalone: true,
  imports: [],
  templateUrl: './claims.component.html',
  styleUrl: './claims.component.scss',
})
export class TreatmentClaimsComponent {
  readonly filter = signal<'all' | ClaimStatus>('all');
  readonly claims = signal<ProviderClaim[]>(SEED_CLAIMS);

  readonly filtered = computed(() => {
    const f = this.filter();
    return f === 'all' ? this.claims() : this.claims().filter(c => c.status === f);
  });

  readonly totalApproved = computed(() =>
    this.claims().filter(c => c.status === 'Approved').reduce((sum, c) => sum + c.amount, 0)
  );

  readonly pendingCount = computed(() => this.claims().filter(c => c.status === 'Pending').length);

  setFilter(f: 'all' | ClaimStatus): void { this.filter.set(f); }

  formatAmount(n: number): string { return '₦' + n.toLocaleString('en-NG'); }

  statusColor(s: ClaimStatus): string {
    return s === 'Approved' ? '#059669' : s === 'Pending' ? '#D97706' : '#DC2626';
  }
}
