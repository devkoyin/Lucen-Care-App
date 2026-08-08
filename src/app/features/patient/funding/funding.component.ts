import { Component, computed, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { PatientProgramsService } from '../../../core/programs/patient-programs.service';

@Component({
  selector: 'lc-funding',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './funding.component.html',
  styleUrl: './funding.component.scss',
})
export class FundingComponent {
  private readonly programsSvc = inject(PatientProgramsService);

  // Derived from the same real feeds the child routes load, so the tiles cannot
  // disagree with the lists beneath them.
  readonly stats = computed(() => {
    const available = this.programsSvc.programs().length;
    const enrollments = this.programsSvc.enrollments();
    // A decision is the thing a patient is waiting for, so it gets its own tile
    // rather than being folded into a single "applied" count.
    const awaiting = enrollments.filter(e => e.status === 'active' || e.status === 'waitlisted').length;
    const selected = enrollments.filter(e => e.status === 'selected').length;
    return [
      { value: String(available), label: 'Programmes open', icon: '🤝' },
      { value: String(awaiting),  label: 'Awaiting a decision', icon: '⏳' },
      { value: String(selected),  label: 'Selected', icon: '✅' },
    ];
  });
}
