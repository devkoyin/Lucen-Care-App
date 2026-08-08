import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthService } from '../../../core/auth/auth.service';
import {
  ProfessionalApplicationsService,
  ProfessionalApplication,
} from '../../../core/applications/professional-applications.service';

@Component({
  selector: 'lc-professional-profile',
  standalone: true,
  templateUrl: './professional-profile.component.html',
  styleUrl: './professional-profile.component.scss',
})
export class ProfessionalProfileComponent {
  private readonly auth = inject(AuthService);
  private readonly apps = inject(ProfessionalApplicationsService);

  private readonly me = toSignal(this.auth.me().pipe(catchError(() => of(null))), {
    initialValue: null,
  });

  readonly editingBio = signal(false);
  readonly bioDraft   = signal('');
  /** Local override so a saved bio shows immediately without refetching /auth/me. */
  private readonly savedBio = signal<string | null>(null);

  readonly application = computed<ProfessionalApplication | undefined>(() => {
    const me = this.me();
    const app = me?.application;
    if (!me || !app) return undefined;

    const bio = this.savedBio() ?? app.bio ?? '';

    return {
      id: app.id,
      status: app.status,
      submittedAt: app.submittedAt,
      fullName: me.name ?? me.email,
      email: me.email,
      phone: app.phone ?? '',
      profession: app.profession ?? 'Other',
      licenseNumber: app.licenseNumber ?? '',
      specialty: app.specialty ?? '',
      yearsOfExperience: app.yearsOfExperience ?? 0,
      bio,
      docs: [
        { label: 'License Number',      submitted: !!app.licenseNumber },
        { label: 'Specialty',           submitted: !!app.specialty },
        { label: 'Years of Experience', submitted: app.yearsOfExperience != null },
        { label: 'Professional Bio',    submitted: !!bio },
      ],
      rejectionReason: app.rejectionReason,
      reviewedAt: app.reviewedAt,
      reviewedBy: app.reviewedBy,
    };
  });

  startEditBio(): void {
    this.bioDraft.set(this.application()?.bio ?? '');
    this.editingBio.set(true);
  }

  saveBio(): void {
    if (!this.application()) return;
    const bio = this.bioDraft();
    this.apps.updateOwnBio(bio).subscribe({
      next: () => {
        this.savedBio.set(bio);
        this.editingBio.set(false);
      },
      error: () => this.editingBio.set(false),
    });
  }

  cancelEditBio(): void {
    this.editingBio.set(false);
  }
}
