import { Component, computed, inject } from '@angular/core';
import { NgoProgramsService, NgoProgram } from '../../../../core/programs/ngo-programs.service';

@Component({
  selector: 'lc-active-plans',
  standalone: true,
  imports: [],
  templateUrl: './active-plans.component.html',
  styleUrl: './active-plans.component.scss',
})
export class ActivePlansComponent {
  private readonly svc = inject(NgoProgramsService);

  readonly appliedPrograms = computed(() =>
    this.svc.programs().filter(p => this.svc.isApplied(p.id))
  );

  withdraw(id: string): void { this.svc.toggleApply(id); }
  slotsAvailable(p: NgoProgram): number { return this.svc.slotsAvailable(p); }
  statusColor(s: NgoProgram['status']): string { return this.svc.statusColor(s); }
}
