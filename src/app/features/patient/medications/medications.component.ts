import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { MedicationStats } from '../../../core/medications/medications.models';
import { MedicationsService } from '../../../core/medications/medications.service';
import { MedicationNotificationService } from '../../../core/notifications/medication-notification.service';
import { AddMedicationModalComponent } from './add-medication-modal.component';

/** Shown until the first stats response lands, or if it fails. */
const EMPTY_STATS: MedicationStats = {
  activeMeds: 0, takenToday: 0, dueToday: 0, adherenceStreakDays: 0,
};

@Component({
  selector: 'lc-medications',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, RouterOutlet, AddMedicationModalComponent],
  templateUrl: './medications.component.html',
  styleUrl: './medications.component.scss',
})
export class MedicationsComponent implements OnInit {
  private readonly medicationsService = inject(MedicationsService);
  private readonly notifService = inject(MedicationNotificationService);

  /**
   * Adding lives on the shell so the action is reachable from every tab, the way
   * Book Appointment is. Editing stays with the All Medications rows, which are the
   * only place a specific medication can be picked.
   */
  readonly showAddMed = signal(false);

  // Read from the service rather than a local copy, so a mutation in a child route
  // (adding a medication, marking a dose taken) is reflected here without a reload.
  readonly stats = computed(() => {
    const s = this.medicationsService.stats() ?? EMPTY_STATS;
    return [
      { value: String(s.activeMeds), label: 'Active Meds', icon: '💊' },
      { value: String(s.takenToday), label: 'Taken Today', icon: '✅' },
      { value: String(s.dueToday), label: 'Due Today', icon: '⏱️' },
      { value: `${s.adherenceStreakDays}d`, label: 'Adherence Streak', icon: '🔥' },
    ];
  });

  ngOnInit(): void {
    this.medicationsService.refreshStats();
  }

  openAdd(): void {
    this.showAddMed.set(true);
  }

  /**
   * The modal owns the request and only emits once the API has confirmed it, so
   * there is no error path here. notifyChanged() is what tells the All Medications
   * child route to reload — it has no other way to learn about a write made up here.
   */
  onSaved(): void {
    this.showAddMed.set(false);
    this.medicationsService.refreshStats();
    this.medicationsService.notifyChanged();
    this.notifService.register();
  }
}
