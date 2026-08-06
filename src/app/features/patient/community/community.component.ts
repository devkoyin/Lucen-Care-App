import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NewPostModalComponent, NewPostData } from './new-post-modal.component';
import { AuthService } from '../../../core/auth/auth.service';
import { CommunityPost, SEED_POSTS } from './community.data';

@Component({
  selector: 'lc-community',
  standalone: true,
  imports: [RouterLink, NewPostModalComponent],
  templateUrl: './community.component.html',
  styleUrl: './community.component.scss',
})
export class CommunityComponent {
  private readonly auth      = inject(AuthService);

  readonly showNewPost = signal(false);
  readonly posts       = signal<CommunityPost[]>(SEED_POSTS);
  readonly activeFilter = signal('all');

  readonly filters = [
    { label: 'All',          key: 'all'          },
    { label: 'Diabetes',     key: 'diabetes'      },
    { label: 'Heart Health', key: 'heart'         },
    { label: 'Hypertension', key: 'hypertension'  },
    { label: 'Wellness',     key: 'wellness'      },
    { label: 'Nutrition',    key: 'nutrition'     },
    { label: 'Mental Health', key: 'mental'       },
  ];

  readonly filteredPosts = computed(() => {
    const f = this.activeFilter();
    return f === 'all' ? this.posts() : this.posts().filter(p => p.groupId === f);
  });

  setFilter(key: string): void { this.activeFilter.set(key); }

  toggleLike(postId: string): void {
    this.posts.update(list =>
      list.map(p => p.id === postId
        ? { ...p, liked: !p.liked, likes: p.liked ? p.likes - 1 : p.likes + 1 }
        : p
      )
    );
  }

  addPost(data: NewPostData): void {
    const meta = this.currentAuthorMeta();
    const post: CommunityPost = {
      id: crypto.randomUUID(),
      author: meta.name,
      authorInitial: meta.initial,
      authorColor: meta.color,
      authorBadge: meta.badge,
      authorSpecialty: meta.specialty,
      groupId: data.groupId,
      groupLabel: data.groupLabel,
      groupColor: data.groupColor,
      timeAgo: 'Just now',
      title: data.title,
      content: data.content,
      likes: 0,
      comments: 0,
      liked: false,
      tags: data.tags,
    };
    this.posts.update(list => [post, ...list]);
    this.setFilter('all');
  }

  private currentAuthorMeta(): { name: string; initial: string; color: string; badge?: 'verified-professional' | 'verified-benefactor'; specialty?: string } {
    const user = this.auth.user();
    // Verification status comes from the server (GET /auth/me), not a local cache —
    // an admin approval happens long after the access token was issued.
    const me = this.auth.meState();
    const application = me?.application;
    const name = me?.name ?? user?.name ?? 'You';
    const initial = name.charAt(0).toUpperCase();

    if (me?.role === 'professional' && application?.status === 'approved') {
      return {
        name,
        initial,
        color: 'var(--color-role-accent)',
        badge: 'verified-professional',
        specialty: application.specialty,
      };
    }

    if (me?.role === 'benefactor' && application?.status === 'approved') {
      return { name, initial, color: '#D97706', badge: 'verified-benefactor' };
    }

    return { name, initial, color: 'var(--color-role-accent)' };
  }
}
