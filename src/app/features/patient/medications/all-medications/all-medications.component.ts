import { Component, OnInit, inject, signal } from '@angular/core';
import { Medication, RefillUrgency, SEED_MEDICATIONS } from '../medications.data';
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
  private readonly notifService = inject(MedicationNotificationService);

  readonly showAddMed  = signal(false);
  readonly editingMed  = signal<Medication | null>(null);
  readonly medications = signal<Medication[]>(SEED_MEDICATIONS);

  ngOnInit(): void {
    this.notifService.register(this.medications());
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

  saveMedication(med: Medication): void {
    this.medications.update(list => {
      const idx = list.findIndex(m => m.id === med.id);
      return idx >= 0
        ? list.map(m => m.id === med.id ? med : m)
        : [med, ...list];
    });
    this.notifService.register(this.medications());
  }

  pillPercent(med: Medication): number {
    return Math.round((med.pillsRemaining / med.pillsTotal) * 100);
  }

  urgencyClass(u: RefillUrgency): string {
    return u;
  }
}
