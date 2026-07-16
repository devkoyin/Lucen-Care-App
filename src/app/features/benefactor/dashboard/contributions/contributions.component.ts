import { Component, signal, computed } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { SEED_CONTRIBUTIONS, BenContribution } from '../../benefactor.data';

type Filter = 'all' | 'active' | 'completed';

@Component({
  selector: 'lc-ben-contributions',
  standalone: true,
  imports: [DecimalPipe],
  templateUrl: './contributions.component.html',
  styleUrl: './contributions.component.scss',
})
export class BenContributionsComponent {
  readonly allContributions: BenContribution[] = SEED_CONTRIBUTIONS;

  readonly filter = signal<Filter>('all');

  readonly filtered = computed(() => {
    const f = this.filter();
    if (f === 'all') return this.allContributions;
    return this.allContributions.filter(c => c.status.toLowerCase() === f);
  });

  readonly totalAmount = computed(() =>
    this.allContributions.reduce((sum, c) => sum + c.amount, 0)
  );

  setFilter(f: Filter) { this.filter.set(f); }
}
