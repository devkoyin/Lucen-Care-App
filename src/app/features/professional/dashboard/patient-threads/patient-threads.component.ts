import { Component, signal, computed } from '@angular/core';
import { SEED_PATIENT_THREADS, PatientThread } from '../../professional.data';

type Filter = 'all' | 'urgent';

@Component({
  selector: 'lc-pro-patient-threads',
  standalone: true,
  imports: [],
  templateUrl: './patient-threads.component.html',
  styleUrl: './patient-threads.component.scss',
})
export class ProPatientThreadsComponent {
  readonly allThreads: PatientThread[] = SEED_PATIENT_THREADS;
  readonly filter = signal<Filter>('all');

  readonly filtered = computed(() =>
    this.filter() === 'urgent'
      ? this.allThreads.filter(t => t.urgent)
      : this.allThreads
  );

  readonly urgentCount = computed(() => this.allThreads.filter(t => t.urgent).length);

  setFilter(f: Filter) { this.filter.set(f); }
}
