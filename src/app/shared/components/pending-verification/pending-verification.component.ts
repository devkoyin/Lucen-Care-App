import { Component, Input, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthService } from '../../../core/auth/auth.service';
import { ReasonNoteComponent } from '../reason-note/reason-note.component';

/**
 * Shown to an account awaiting admin approval, for every role that needs one.
 *
 * `waitingMessage` comes from the route's `data` — bound automatically by
 * `withComponentInputBinding()` in app.config.ts — so each portal supplies copy
 * matching what its onboarding wizard told the user on submission, with no
 * per-role component file.
 */
@Component({
  selector: 'lc-pending-verification',
  standalone: true,
  imports: [ReasonNoteComponent],
  template: `
    <div class="pending-page">
      <div class="pending-page__icon" aria-hidden="true">{{ icon }}</div>
      <h1 class="pending-page__title">{{ title }}</h1>
      <p class="pending-page__desc">{{ description }}</p>

      @if (rejected) {
        <!-- Labelled separately from the description so the reason cannot be
             mistaken for the outcome itself. -->
        @if (rejectionReason) {
          <lc-reason-note class="pending-page__reason">{{ rejectionReason }}</lc-reason-note>
        }
        <p class="pending-page__next">{{ nextStep }}</p>
      }
    </div>
  `,
  styles: [`
    .pending-page {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 60vh;
      gap: var(--space-4);
      text-align: center;
      padding: var(--space-12);
    }
    .pending-page__icon { font-size: 48px; }
    .pending-page__title {
      font-size: var(--text-xl);
      font-weight: var(--font-extrabold);
      color: var(--color-text);
      margin: 0;
    }
    .pending-page__desc {
      font-size: var(--text-sm);
      color: var(--color-text-secondary);
      max-width: 420px;
      margin: 0;
    }
    /* The page centres its children, so the note needs an explicit width and
       left alignment to line up with the text above rather than hugging its
       content. */
    .pending-page__reason {
      width: 100%;
      max-width: 420px;
      text-align: left;
    }
    .pending-page__next {
      font-size: var(--text-xs);
      color: var(--color-text-muted);
      max-width: 420px;
      margin: 0;
    }
  `],
})
export class PendingVerificationComponent {
  private readonly auth = inject(AuthService);

  /** Role-specific "what happens next" copy, supplied by the route's `data`. */
  @Input() waitingMessage =
    'Our team is reviewing your application. You will have access once it is approved.';

  /** Live account state from GET /auth/me — see AuthService.me(). */
  private readonly me = toSignal(this.auth.me().pipe(catchError(() => of(null))), {
    initialValue: null,
  });

  // One application, two homes: professional and benefactor applications live on
  // their own row, NGO and HMO applications are recorded on the organisation. Both
  // expose the same `status` and `rejectionReason`, so the view needs no branching.
  private get application() {
    const me = this.me();
    return me?.application ?? me?.organization;
  }

  get rejected(): boolean {
    return this.application?.status === 'rejected';
  }

  get icon(): string {
    return this.rejected ? '✕' : '⏳';
  }

  get title(): string {
    return this.rejected ? 'Application rejected' : 'Verification in progress';
  }

  /**
   * The outcome only. The reason used to be returned from here, which left the
   * user with a bare sentence and no indication of what it was.
   */
  get description(): string {
    return this.rejected ? 'Your application was not approved.' : this.waitingMessage;
  }

  /** Rendered in its own labelled note. Absent when the reviewer gave no reason. */
  get rejectionReason(): string | undefined {
    return this.application?.rejectionReason;
  }

  /**
   * Shown on every rejection. Previously this only appeared when there was NO
   * reason, so the users given the most to act on were the only ones told nothing
   * about what to do next.
   */
  readonly nextStep =
    'If you believe this is a mistake, contact support for more information.';
}
