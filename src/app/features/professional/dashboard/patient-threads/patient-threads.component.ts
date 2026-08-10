import { Component, OnInit, inject, signal } from '@angular/core';

import { CommunityPostsService } from '../../../../core/community/community-posts.service';
import { CommunityPost } from '../../../../core/community/community.models';
import { PostSummaryListComponent } from '../../../community/post-summary-list/post-summary-list.component';

/**
 * Questions nobody has answered yet.
 *
 * The seed data this replaces carried an `urgent` flag with no server-side
 * definition — nothing in the platform records urgency, so the filter sorted by a
 * fabricated field. The real distinction the API can make is answered or not.
 */
@Component({
  selector: 'lc-pro-patient-threads',
  standalone: true,
  imports: [PostSummaryListComponent],
  templateUrl: './patient-threads.component.html',
  styleUrl: './patient-threads.component.scss',
})
export class ProPatientThreadsComponent implements OnInit {
  private readonly posts$ = inject(CommunityPostsService);

  readonly threads = signal<CommunityPost[]>([]);
  readonly loading = signal(true);
  readonly loadError = signal(false);

  ngOnInit(): void {
    this.posts$.loadUnanswered().subscribe({
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
