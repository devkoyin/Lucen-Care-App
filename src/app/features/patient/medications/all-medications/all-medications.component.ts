import { Component, OnInit, inject, signal } from '@angular/core';
import { CreateMedicationPayload, Medication, RefillUrgency } from '../../../../core/medications/medications.models';
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
  readonly medications = signal<Medication[]>([]);

  ngOnInit(): void {
    this.medicationsService.getMedications().subscribe(meds => this.medications.set(meds));
    this.notifService.register();
  }

  addMedication(payload: CreateMedicationPayload): void {
    this.medicationsService.createMedication(payload).subscribe(med => {
      this.medications.update(list => [med, ...list]);
    });
  }

  pillPercent(med: Medication): number {
    return Math.round((med.pillsRemaining / med.pillsTotal) * 100);
  }

  urgencyClass(u: RefillUrgency): string {
    return u;
  }
}
