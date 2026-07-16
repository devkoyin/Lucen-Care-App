import { Component } from '@angular/core';
import { CoveragePlan, SEED_PLANS, SEED_PROGRAMS, AssistanceProgram } from '../funding.data';
import { signal } from '@angular/core';

@Component({
  selector: 'lc-active-plans',
  standalone: true,
  imports: [],
  templateUrl: './active-plans.component.html',
  styleUrl: './active-plans.component.scss',
})
export class ActivePlansComponent {
  readonly plans    = SEED_PLANS;
  readonly programs = signal<AssistanceProgram[]>(SEED_PROGRAMS);

  readonly enrolledCount = this.programs().filter(p => p.enrolled).length;

  toggleEnroll(id: string): void {
    this.programs.update(list =>
      list.map(p => p.id === id ? { ...p, enrolled: !p.enrolled } : p)
    );
  }
}
