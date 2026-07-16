import { Component, computed, signal } from '@angular/core';
import { NetworkProvider, SEED_PROVIDERS } from '../funding.data';

@Component({
  selector: 'lc-accredited-providers',
  standalone: true,
  imports: [],
  templateUrl: './providers.component.html',
  styleUrl: './providers.component.scss',
})
export class AccreditedProvidersComponent {
  readonly searchQuery = signal('');
  readonly providers   = SEED_PROVIDERS;

  readonly filtered = computed(() => {
    const q = this.searchQuery().toLowerCase().trim();
    if (!q) return this.providers;
    return this.providers.filter(p =>
      p.name.toLowerCase().includes(q) ||
      p.area.toLowerCase().includes(q) ||
      p.type.toLowerCase().includes(q) ||
      p.plans.some(pl => pl.toLowerCase().includes(q))
    );
  });
}
