import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../auth/auth.service';
import { Medication } from '../../features/patient/medications/medications.component';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class MedicationNotificationService {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthService);
  private readonly base = `${environment.apiUrl}/notifications`;

  /**
   * Send the full medication list to the backend.
   * Called on page load and whenever a medication is added.
   * The backend owns all scheduling and email sending from here.
   */
  register(medications: Medication[]): void {
    const user = this.auth.user();
    if (!user) return;

    this.http
      .post(`${this.base}/register`, {
        userId:   user.id,
        email:    user.email,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        medications: medications.map(m => ({
          id:           m.id,
          name:         m.name,
          dosage:       m.dosage,
          schedule:     m.schedule,
          refillDateISO: m.refillDateISO,
        })),
      })
      .subscribe({
        error: err =>
          console.warn('[MedNotif] Backend not reachable — notifications paused:', err.message),
      });
  }

  /** Called on sign-out so the backend stops sending for this user. */
  unregister(): void {
    const user = this.auth.user();
    if (!user) return;
    this.http.delete(`${this.base}/unregister/${user.id}`).subscribe();
  }
}
