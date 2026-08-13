import { Injectable, inject } from '@angular/core';
import { AuthService } from '../auth/auth.service';
import { MedicationsService } from '../medications/medications.service';

@Injectable({ providedIn: 'root' })
export class MedicationNotificationService {
  private readonly auth = inject(AuthService);
  private readonly medicationsService = inject(MedicationsService);

  /**
   * Opts the current patient in to medication reminder emails.
   * Called on page load and whenever a medication is added.
   * The backend reads schedule/refill data from its own medications table.
   */
  register(): void {
    const user = this.auth.user();
    if (!user) return;

    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    this.medicationsService.registerReminders(timezone).subscribe({
      error: err =>
        console.warn('[MedNotif] Backend not reachable — notifications paused:', err.message),
    });
  }

  /** Called on sign-out so the backend stops sending for this user. */
  unregister(): void {
    const user = this.auth.user();
    if (!user) return;
    this.medicationsService.unregisterReminders().subscribe();
  }
}
