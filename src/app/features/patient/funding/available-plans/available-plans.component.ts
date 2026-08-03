import { Component, inject } from '@angular/core';
import { NgoProgramsService, NgoProgram } from '../../../../core/programs/ngo-programs.service';

@Component({
  selector: 'lc-available-plans',
  standalone: true,
  imports: [],
  templateUrl: './available-plans.component.html',
  styleUrl: './available-plans.component.scss',
})
export class AvailablePlansComponent {
  readonly svc = inject(NgoProgramsService);
  readonly programs = this.svc.programs;

  isApplied(id: string): boolean { return this.svc.isApplied(id); }
  toggleApply(id: string): void { this.svc.toggleApply(id); }
  slotsAvailable(p: NgoProgram): number { return this.svc.slotsAvailable(p); }
  statusColor(s: NgoProgram['status']): string { return this.svc.statusColor(s); }
}
