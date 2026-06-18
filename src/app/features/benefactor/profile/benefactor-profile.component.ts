import { Component, inject } from '@angular/core';
import { AuthService } from '../../../core/auth/auth.service';
import { BenefactorApplicationsService, BenefactorApplication } from '../../../core/applications/benefactor-applications.service';

@Component({
  selector: 'lc-benefactor-profile',
  standalone: true,
  templateUrl: './benefactor-profile.component.html',
  styleUrl: './benefactor-profile.component.scss',
})
export class BenefactorProfileComponent {
  private readonly auth = inject(AuthService);
  private readonly apps = inject(BenefactorApplicationsService);

  get application(): BenefactorApplication | undefined {
    return this.apps.findByEmail(this.auth.user()?.email ?? '');
  }
}
