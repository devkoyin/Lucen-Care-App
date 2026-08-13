import { Component, OnInit, inject, signal } from '@angular/core';
import { RefillAlert } from '../../../../core/medications/medications.models';
import { MedicationsService } from '../../../../core/medications/medications.service';

@Component({
  selector: 'lc-med-refills',
  standalone: true,
  templateUrl: './refills.component.html',
  styleUrl: './refills.component.scss',
})
export class MedRefillsComponent implements OnInit {
  private readonly medicationsService = inject(MedicationsService);

  readonly refillAlerts = signal<RefillAlert[]>([]);
  readonly okCount = signal(0);
  readonly requestedIds = signal<Set<string>>(new Set());
  readonly loadError = signal(false);
  readonly requestError = signal<string | null>(null);

  ngOnInit(): void {
    this.medicationsService.getRefillAlerts().subscribe({
      next: result => {
        this.refillAlerts.set(result.alerts);
        this.okCount.set(result.okCount);
        this.loadError.set(false);
      },
      error: () => this.loadError.set(true),
    });
  }

  requestRefill(medicationId: string): void {
    this.requestError.set(null);
    this.medicationsService.requestRefill(medicationId).subscribe({
      next: () => this.requestedIds.update(ids => new Set(ids).add(medicationId)),
      // Was marked requested optimistically with no rollback, so a failed request
      // still showed as sent.
      error: () => this.requestError.set('Could not request this refill. Please try again.'),
    });
  }

  isRequested(medicationId: string): boolean {
    return this.requestedIds().has(medicationId);
  }
}
