import { Component } from '@angular/core';
import { DoseStatus, SEED_SCHEDULE } from '../medications.data';

@Component({
  selector: 'lc-med-schedule',
  standalone: true,
  templateUrl: './schedule.component.html',
  styleUrl: './schedule.component.scss',
})
export class MedScheduleComponent {
  readonly schedule = SEED_SCHEDULE;
  readonly today = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  statusLabel(status: DoseStatus): string {
    return { taken: 'Taken', pending: 'Due now', later: 'Later', skipped: 'Skipped' }[status];
  }
}
