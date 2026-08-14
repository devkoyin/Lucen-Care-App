import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthService } from '../../../core/auth/auth.service';
import { BenefactorApplication } from '../../../core/applications/benefactor-applications.service';
import { BackLinkComponent } from '../../../shared/components/back-link/back-link.component';

@Component({
  selector: 'lc-benefactor-profile',
  standalone: true,
  imports: [BackLinkComponent],
  templateUrl: './benefactor-profile.component.html',
  styleUrl: './benefactor-profile.component.scss',
})
export class BenefactorProfileComponent {
  private readonly auth = inject(AuthService);

  private readonly me = toSignal(this.auth.me().pipe(catchError(() => of(null))), {
    initialValue: null,
  });

  /** Null until GET /auth/me resolves; the template renders a placeholder meanwhile. */
  readonly application = computed<BenefactorApplication | null>(() => {
    const me = this.me();
    const app = me?.application;
    if (!me || !app) return null;

    return {
      id: app.id,
      status: app.status,
      submittedAt: app.submittedAt,
      fullName: app.fullName ?? me.name ?? '',
      email: me.email,
      phone: app.phone ?? '',
      reasonForSupport: app.reasonForSupport ?? '',
      docs: [{ label: 'Identity verification consent', submitted: !!app.idConsentGiven }],
      rejectionReason: app.rejectionReason,
      reviewedAt: app.reviewedAt,
      reviewedBy: app.reviewedBy,
    };
  });
}
