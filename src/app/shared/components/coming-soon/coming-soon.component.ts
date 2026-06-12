import { Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'lc-coming-soon',
  standalone: true,
  imports: [],
  template: `
    <div class="coming-soon">
      <div class="coming-soon__icon">🚧</div>
      <h2 class="coming-soon__title">{{ title }} — Coming Soon</h2>
      <p class="coming-soon__sub">This module is under construction. Check back soon.</p>
    </div>
  `,
  styles: [`
    .coming-soon {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 60vh;
      gap: 16px;
      text-align: center;
      padding: 48px;

      &__icon { font-size: 48px; }

      &__title {
        font-size: var(--text-xl);
        font-weight: var(--font-bold);
        color: var(--color-text);
        margin: 0;
      }

      &__sub {
        font-size: var(--text-sm);
        color: var(--color-text-secondary);
        margin: 0;
      }
    }
  `],
})
export class ComingSoonComponent {
  private readonly route = inject(ActivatedRoute);

  get title(): string {
    return this.route.snapshot.data['label'] ?? 'Page';
  }
}
