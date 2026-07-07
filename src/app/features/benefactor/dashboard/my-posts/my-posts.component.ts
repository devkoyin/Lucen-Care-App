import { Component } from '@angular/core';
import { SEED_BEN_POSTS, BenPost } from '../../benefactor.data';

@Component({
  selector: 'lc-ben-my-posts',
  standalone: true,
  imports: [],
  templateUrl: './my-posts.component.html',
  styleUrl: './my-posts.component.scss',
})
export class BenMyPostsComponent {
  readonly posts: BenPost[] = SEED_BEN_POSTS;
}
