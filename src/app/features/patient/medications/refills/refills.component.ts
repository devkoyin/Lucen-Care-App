import { Component } from '@angular/core';
import { SEED_MEDICATIONS, SEED_REFILL_ALERTS } from '../medications.data';

@Component({
  selector: 'lc-med-refills',
  standalone: true,
  templateUrl: './refills.component.html',
  styleUrl: './refills.component.scss',
})
export class MedRefillsComponent {
  readonly refillAlerts = SEED_REFILL_ALERTS;
  readonly okCount = SEED_MEDICATIONS.length - SEED_REFILL_ALERTS.length;
}
