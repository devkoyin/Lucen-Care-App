import { Component, computed, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { NgoProgramsService } from '../../../core/programs/ngo-programs.service';

@Component({
  selector: 'lc-funding',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './funding.component.html',
  styleUrl: './funding.component.scss',
})
export class FundingComponent {
  private readonly programsSvc = inject(NgoProgramsService);

  readonly stats = computed(() => {
    const progs = this.programsSvc.programs();
    const available = progs.filter(p => p.status === 'Active' || p.status === 'Closing').length;
    return [
      { value: String(progs.length),  label: 'Total programmes', icon: '🤝' },
      { value: String(available),     label: 'Accepting applications', icon: '✅' },
    ];
  });
}
