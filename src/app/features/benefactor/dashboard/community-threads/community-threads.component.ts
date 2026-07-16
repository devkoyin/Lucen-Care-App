import { Component } from '@angular/core';
import { SEED_BEN_THREADS, BenThread } from '../../benefactor.data';

@Component({
  selector: 'lc-ben-community-threads',
  standalone: true,
  imports: [],
  templateUrl: './community-threads.component.html',
  styleUrl: './community-threads.component.scss',
})
export class BenCommunityThreadsComponent {
  readonly threads: BenThread[] = SEED_BEN_THREADS;
}
