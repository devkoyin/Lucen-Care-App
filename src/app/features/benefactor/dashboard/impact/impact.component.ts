import { Component } from '@angular/core';
import { BEN_IMPACT, BEN_IMPACT_HIGHLIGHTS } from '../../benefactor.data';

@Component({
  selector: 'lc-ben-impact',
  standalone: true,
  imports: [],
  templateUrl: './impact.component.html',
  styleUrl: './impact.component.scss',
})
export class BenImpactComponent {
  readonly impact    = BEN_IMPACT;
  readonly highlights = BEN_IMPACT_HIGHLIGHTS;
}
