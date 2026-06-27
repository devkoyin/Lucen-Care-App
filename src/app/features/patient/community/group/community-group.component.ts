import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { SEED_GROUPS, SEED_POSTS, CommunityPost } from '../community.data';
import { NewPostModalComponent, NewPostData } from '../new-post-modal.component';

@Component({
  selector: 'lc-community-group',
  standalone: true,
  imports: [RouterLink, NewPostModalComponent],
  templateUrl: './community-group.component.html',
  styleUrl: './community-group.component.scss',
})
export class CommunityGroupComponent {
  private readonly route = inject(ActivatedRoute);

  readonly showNewPost = signal(false);

  readonly groupId = computed(() => this.route.snapshot.paramMap.get('id') ?? '');

  readonly group = computed(() => SEED_GROUPS.find(g => g.id === this.groupId()) ?? null);

  readonly posts = signal<CommunityPost[]>(
    SEED_POSTS.filter(p => p.groupId === this.route.snapshot.paramMap.get('id'))
  );

  toggleLike(postId: string): void {
    this.posts.update(list =>
      list.map(p => p.id === postId
        ? { ...p, liked: !p.liked, likes: p.liked ? p.likes - 1 : p.likes + 1 }
        : p
      )
    );
  }

  addPost(data: NewPostData): void {
    const g = this.group();
    if (!g) return;
    const post: CommunityPost = {
      id: crypto.randomUUID(),
      author: 'You',
      authorInitial: 'Y',
      authorColor: g.accent,
      groupId: g.id,
      groupLabel: g.name,
      groupColor: g.accent,
      timeAgo: 'Just now',
      title: data.title,
      content: data.content,
      likes: 0,
      comments: 0,
      liked: false,
      tags: data.tags,
    };
    this.posts.update(list => [post, ...list]);
  }
}
