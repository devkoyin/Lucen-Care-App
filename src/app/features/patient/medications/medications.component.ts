import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { MedicationStats } from '../../../core/medications/medications.models';
import { MedicationsService } from '../../../core/medications/medications.service';

@Component({
  selector: 'lc-medications',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './medications.component.html',
  styleUrl: './medications.component.scss',
})
export class MedicationsComponent implements OnInit {
  private readonly medicationsService = inject(MedicationsService);

  private readonly medStats = signal<MedicationStats>({
    activeMeds: 0, takenToday: 0, dueToday: 0, adherenceStreakDays: 0,
  });

  readonly stats = computed(() => {
    const s = this.medStats();
    return [
      { value: String(s.activeMeds), label: 'Active Meds', icon: '💊' },
      { value: String(s.takenToday), label: 'Taken Today', icon: '✅' },
      { value: String(s.dueToday), label: 'Due Today', icon: '⏱️' },
      { value: `${s.adherenceStreakDays}d`, label: 'Adherence Streak', icon: '🔥' },
    ];
  });

  ngOnInit(): void {
    this.medicationsService.getStats().subscribe(s => this.medStats.set(s));
  }
}
