import { Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';

/**
 * The "← Settings" link at the top of every settings module.
 *
 * The default route is `..`, which RouterLink resolves against the ActivatedRoute
 * of whichever routed component hosts this one. Every settings module sits exactly
 * one level under its portal's landing page, so no page has to name its own path —
 * and none of them break if the portal prefix ever changes.
 */
@Component({
  selector: 'lc-back-link',
  standalone: true,
  imports: [RouterLink],
  template: `
    <a class="back-link" [routerLink]="route">
      <span class="back-link__arrow" aria-hidden="true">←</span>{{ label }}
    </a>
  `,
  styleUrl: './back-link.component.scss',
})
export class BackLinkComponent {
  @Input() label = 'Settings';
  @Input() route: string | unknown[] = '..';
}
