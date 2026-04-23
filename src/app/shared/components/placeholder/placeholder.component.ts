import { Component, Input } from '@angular/core';

@Component({
  selector: 'lc-placeholder',
  standalone: true,
  template: `
    <div style="min-height:100vh;display:flex;align-items:center;justify-content:center;background:var(--color-bg);">
      <div style="text-align:center;">
        <div style="color:var(--color-accent);font-size:32px;margin-bottom:16px;">🚧</div>
        <div style="color:white;font-size:20px;font-weight:700;margin-bottom:8px;">{{ title }}</div>
        <div style="color:var(--color-text-muted);font-size:14px;">Coming in a future plan</div>
      </div>
    </div>
  `,
})
export class PlaceholderComponent {
  @Input() title = 'Coming Soon';
}
