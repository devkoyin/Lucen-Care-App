import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NewPostModalComponent, NewPostData } from './new-post-modal.component';
import { AuthService } from '../../../core/auth/auth.service';
import { ProfessionalApplicationsService } from '../../../core/applications/professional-applications.service';
import { BenefactorApplicationsService } from '../../../core/applications/benefactor-applications.service';
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
  private readonly profApps  = inject(ProfessionalApplicationsService);
  private readonly benefApps = inject(BenefactorApplicationsService);

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
    if (user?.role === 'professional') {
      const application = this.profApps.findByEmail(user.email);
      if (application?.status === 'approved') {
        return {
          name: user.name,
          initial: user.name.charAt(0).toUpperCase(),
          color: 'var(--color-role-accent)',
          badge: 'verified-professional',
          specialty: application.specialty,
        };
      }
    }
    if (user?.role === 'benefactor') {
      const application = this.benefApps.findByEmail(user.email);
      if (application?.status === 'approved') {
        return {
          name: user.name,
          initial: user.name.charAt(0).toUpperCase(),
          color: '#D97706',
          badge: 'verified-benefactor',
        };
      }
    }
    return {
      name: user?.name ?? 'You',
      initial: (user?.name ?? 'Y').charAt(0).toUpperCase(),
      color: 'var(--color-role-accent)',
    };
  }
}
