import { Component, inject, signal } from '@angular/core';
import { AuthService } from '../../../core/auth/auth.service';
import { ProfessionalApplicationsService, ProfessionalApplication } from '../../../core/applications/professional-applications.service';

@Component({
  selector: 'lc-professional-profile',
  standalone: true,
  templateUrl: './professional-profile.component.html',
  styleUrl: './professional-profile.component.scss',
})
export class ProfessionalProfileComponent {
  private readonly auth = inject(AuthService);
  private readonly apps = inject(ProfessionalApplicationsService);

  readonly editingBio = signal(false);
  readonly bioDraft   = signal('');

  get application(): ProfessionalApplication | undefined {
    return this.apps.findByEmail(this.auth.user()?.email ?? '');
  }

  startEditBio(): void {
    this.bioDraft.set(this.application?.bio ?? '');
    this.editingBio.set(true);
  }

  saveBio(): void {
    const app = this.application;
    if (!app) return;
    this.apps.updateBio(app.id, this.bioDraft());
    this.editingBio.set(false);
  }

  cancelEditBio(): void {
    this.editingBio.set(false);
  }
}
