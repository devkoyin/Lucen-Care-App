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

  ngOnInit(): void {
    this.medicationsService.getRefillAlerts().subscribe(result => {
      this.refillAlerts.set(result.alerts);
      this.okCount.set(result.okCount);
    });
  }

  requestRefill(medicationId: string): void {
    this.medicationsService.requestRefill(medicationId).subscribe(() => {
      this.requestedIds.update(ids => new Set(ids).add(medicationId));
    });
  }

  isRequested(medicationId: string): boolean {
    return this.requestedIds().has(medicationId);
  }
}
