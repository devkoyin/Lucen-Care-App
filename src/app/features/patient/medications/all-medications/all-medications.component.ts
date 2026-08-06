import { Component, OnInit, inject, signal } from '@angular/core';
import { Medication, RefillUrgency } from '../../../../core/medications/medications.models';
import { MedicationsService } from '../../../../core/medications/medications.service';
import { AddMedicationModalComponent } from '../add-medication-modal.component';
import { MedicationNotificationService } from '../../../../core/notifications/medication-notification.service';

@Component({
  selector: 'lc-all-medications',
  standalone: true,
  imports: [AddMedicationModalComponent],
  templateUrl: './all-medications.component.html',
  styleUrl: './all-medications.component.scss',
})
export class AllMedicationsComponent implements OnInit {
  private readonly medicationsService = inject(MedicationsService);
  private readonly notifService = inject(MedicationNotificationService);

  readonly showAddMed  = signal(false);
  readonly editingMed  = signal<Medication | null>(null);
  readonly medications = signal<Medication[]>([]);
  readonly loading     = signal(true);
  readonly loadError   = signal(false);

  ngOnInit(): void {
    this.loadMedications();
    this.notifService.register();
  }

  /** Distinguishes "no medications yet" from "the request failed" in the template. */
  private loadMedications(): void {
    this.loading.set(true);
    this.medicationsService.getMedications().subscribe({
      next: meds => {
        this.medications.set(meds);
        this.loadError.set(false);
        this.loading.set(false);
      },
      error: () => {
        this.loadError.set(true);
        this.loading.set(false);
      },
    });
  }

  retry(): void {
    this.loadMedications();
  }

  openAdd(): void {
    this.editingMed.set(null);
    this.showAddMed.set(true);
  }

  openEdit(med: Medication): void {
    this.showAddMed.set(false);
    this.editingMed.set(med);
  }

  closeModal(): void {
    this.showAddMed.set(false);
    this.editingMed.set(null);
  }

  /**
   * The modal owns the request and only emits this once the API has confirmed it,
   * so there is no error path to handle here — just refresh what the write changed.
   */
  onSaved(): void {
    this.loadMedications();
    this.medicationsService.refreshStats();
    this.notifService.register();
  }

  pillPercent(med: Medication): number {
    if (!med.pillsTotal) return 0;
    return Math.min(100, Math.round((med.pillsRemaining / med.pillsTotal) * 100));
  }

  urgencyClass(u: RefillUrgency): string {
    return u;
  }
}
