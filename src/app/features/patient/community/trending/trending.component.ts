import { Component } from '@angular/core';
import { TRENDING } from '../community.data';

@Component({
  selector: 'lc-community-trending',
  standalone: true,
  templateUrl: './trending.component.html',
  styleUrl: './trending.component.scss',
})
export class TrendingComponent {
  readonly trending = TRENDING;
  readonly maxCount = Math.max(...TRENDING.map(t => t.count));
}
