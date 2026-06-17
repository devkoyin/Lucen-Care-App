import { Component, inject } from '@angular/core';
import { AuthService } from '../../../core/auth/auth.service';
import { ProfessionalApplicationsService } from '../../../core/applications/professional-applications.service';

@Component({
  selector: 'lc-professional-pending',
  standalone: true,
  template: `
    <div class="pending-page">
      <div class="pending-page__icon" aria-hidden="true">{{ icon }}</div>
      <h1 class="pending-page__title">{{ title }}</h1>
      <p class="pending-page__desc">{{ description }}</p>
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
  `],
})
export class ProfessionalPendingComponent {
  private readonly auth = inject(AuthService);
  private readonly apps = inject(ProfessionalApplicationsService);

  private get application() {
    return this.apps.findByEmail(this.auth.user()?.email ?? '');
  }

  get icon(): string {
    return this.application?.status === 'rejected' ? '✕' : '⏳';
  }

  get title(): string {
    return this.application?.status === 'rejected' ? 'Application rejected' : 'Verification in progress';
  }

  get description(): string {
    if (this.application?.status === 'rejected') {
      return this.application.rejectionReason || 'Your application was not approved. Contact support for more information.';
    }
    return 'Our team is reviewing your credentials. You will be able to access communities once your account is verified.';
  }
}
