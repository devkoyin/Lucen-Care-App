import { Component, OnInit, inject, signal } from '@angular/core';
import { DoseStatus, ScheduledDose, ScheduleSlot } from '../../../../core/medications/medications.models';
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

  ngOnInit(): void {
    this.loadSchedule();
  }

  //backend should return due now status within 30 mins before and any time after the 
  // scheduled time. 
  statusLabel(status: DoseStatus): string {
    return { taken: 'Taken', pending: 'Due now', later: 'Later', skipped: 'Skipped' }[status];
  }

  markTaken(dose: ScheduledDose, scheduledTime: string): void {
    this.medicationsService.logDose(dose.medicationId, scheduledTime, 'taken').subscribe(() => this.loadSchedule());
  }

  private loadSchedule(): void {
    this.medicationsService.getSchedule().subscribe(slots => this.schedule.set(slots));
  }
}
