import { Component, Input } from '@angular/core';

/**
 * A labelled note explaining why something was rejected.
 *
 * Extracted from the four admin approvals screens, which each carried an identical
 * copy of this markup and its styles. The label copy and every colour value are
 * unchanged from that original, so those screens look exactly as they did.
 *
 * Usage — the caller supplies the reason as content:
 *   <lc-reason-note>{{ app.rejectionReason }}</lc-reason-note>
 */
@Component({
  selector: 'lc-reason-note',
  standalone: true,
  template: `<div class="reason-note" role="note"><span class="reason-note__label">{{ label }}</span><ng-content /></div>`,
  styleUrl: './reason-note.component.scss',
})
export class ReasonNoteComponent {
  /** Defaults to the copy the admin approvals screens already used. */
  @Input() label = 'Rejection reason:';
}
