import { Component, OnInit, inject, signal } from '@angular/core';

import { CommunityPostsService } from '../../../../core/community/community-posts.service';
import { CommunityPost } from '../../../../core/community/community.models';
import { PostSummaryListComponent } from '../../../community/post-summary-list/post-summary-list.component';

@Component({
  selector: 'lc-ben-my-posts',
  standalone: true,
  imports: [PostSummaryListComponent],
  templateUrl: './my-posts.component.html',
  styleUrl: './my-posts.component.scss',
})
export class BenMyPostsComponent implements OnInit {
  private readonly posts$ = inject(CommunityPostsService);

  readonly posts = signal<CommunityPost[]>([]);
  readonly loading = signal(true);
  readonly loadError = signal(false);

  ngOnInit(): void {
    this.posts$.loadMyPosts().subscribe({
      next: rows => {
        this.posts.set(rows);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.loadError.set(true);
      },
    });
  }
}
