import { Component } from '@angular/core';
import { SEED_PRO_POSTS, ProPost } from '../../professional.data';

@Component({
  selector: 'lc-pro-my-posts',
  standalone: true,
  imports: [],
  templateUrl: './my-posts.component.html',
  styleUrl: './my-posts.component.scss',
})
export class ProMyPostsComponent {
  readonly posts: ProPost[] = SEED_PRO_POSTS;
}
