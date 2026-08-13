import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { CommunityPostsService } from '../../../core/community/community-posts.service';
import { TrendingTag } from '../../../core/community/community.models';
import { CommunityNavService } from '../community-nav.service';

@Component({
  selector: 'lc-community-trending',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './trending.component.html',
  styleUrl: './trending.component.scss',
})
export class TrendingComponent implements OnInit {
  private readonly posts$ = inject(CommunityPostsService);
  readonly nav = inject(CommunityNavService);

  readonly trending = signal<TrendingTag[]>([]);
  readonly loading = signal(true);
  readonly loadError = signal(false);

  /**
   * Guarded against an empty list: Math.max() of nothing is -Infinity, which the
   * old version would have turned into NaN% bar widths the moment the hardcoded
   * array was replaced by a real one.
   */
  readonly maxCount = computed(() => {
    const counts = this.trending().map(t => t.count);
    return counts.length ? Math.max(...counts) : 1;
  });

  readonly feedLink = computed(() => this.nav.link('feed'));

  ngOnInit(): void {
    this.reload();
  }

  reload(): void {
    this.loading.set(true);
    this.loadError.set(false);
    this.posts$.loadTrending().subscribe({
      next: rows => {
        this.trending.set(rows);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.loadError.set(true);
      },
    });
  }

  width(count: number): number {
    return (count / this.maxCount()) * 100;
  }
}
