import { Component, OnInit, inject, signal } from '@angular/core';
import { ScheduledDose, ScheduleSlot, doseStatusLabel } from '../../../../core/medications/medications.models';
import { MedicationsService } from '../../../../core/medications/medications.service';

@Component({
  selector: 'lc-med-schedule',
  standalone: true,
  templateUrl: './schedule.component.html',
  styleUrl: './schedule.component.scss',
})
export class MedScheduleComponent implements OnInit {
  private readonly medicationsService = inject(MedicationsService);

  readonly schedule = signal<ScheduleSlot[]>([]);
  readonly today = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  readonly statusLabel = doseStatusLabel;

  ngOnInit(): void {
    this.loadSchedule();
  }

  markTaken(dose: ScheduledDose, scheduledTime: string): void {
    this.medicationsService.logDose(dose.medicationId, scheduledTime, 'taken').subscribe(() => this.loadSchedule());
  }

  private loadSchedule(): void {
    this.medicationsService.getSchedule().subscribe(slots => this.schedule.set(slots));
  }
}
