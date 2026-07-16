import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SEED_EXPERTISE_AREAS, ExpertiseArea } from '../../professional.data';

@Component({
  selector: 'lc-pro-expertise',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './expertise.component.html',
  styleUrl: './expertise.component.scss',
})
export class ProExpertiseComponent {
  readonly areas: ExpertiseArea[] = SEED_EXPERTISE_AREAS;

  readonly totalEndorsements = this.areas.reduce((s, a) => s + a.endorsements, 0);
  readonly totalPosts = this.areas.reduce((s, a) => s + a.postCount, 0);
}
