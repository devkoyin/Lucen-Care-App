import { Component, OnInit, inject, signal } from '@angular/core';

import { CommunityPostsService } from '../../../../core/community/community-posts.service';
import { CommunityPost } from '../../../../core/community/community.models';
import { PostSummaryListComponent } from '../../../community/post-summary-list/post-summary-list.component';

@Component({
  selector: 'lc-ben-community-threads',
  standalone: true,
  imports: [PostSummaryListComponent],
  templateUrl: './community-threads.component.html',
  styleUrl: './community-threads.component.scss',
})
export class BenCommunityThreadsComponent implements OnInit {
  private readonly posts$ = inject(CommunityPostsService);

  readonly threads = signal<CommunityPost[]>([]);
  readonly loading = signal(true);
  readonly loadError = signal(false);

  ngOnInit(): void {
    // Only the communities this benefactor has joined — a dashboard listing every
    // post on the platform is a firehose, not a summary.
    this.posts$.loadFeed({ joinedOnly: true }, 10).subscribe({
      next: rows => {
        this.threads.set(rows);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.loadError.set(true);
      },
    });
  }
}
