import { Component, OnInit, computed, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { MedicationStats } from '../../../core/medications/medications.models';
import { MedicationsService } from '../../../core/medications/medications.service';

/** Shown until the first stats response lands, or if it fails. */
const EMPTY_STATS: MedicationStats = {
  activeMeds: 0, takenToday: 0, dueToday: 0, adherenceStreakDays: 0,
};

@Component({
  selector: 'lc-medications',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './medications.component.html',
  styleUrl: './medications.component.scss',
})
export class MedicationsComponent implements OnInit {
  private readonly medicationsService = inject(MedicationsService);

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
}
