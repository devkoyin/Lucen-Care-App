import { Component, computed, effect, inject, input, output, signal } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { CommunityGroup } from '../../core/community/community.models';
import { ColorSelectComponent, ColorSelectOption } from '../../shared/components/color-select/color-select.component';
import { CommunityNavService } from './community-nav.service';

export interface NewPostData {
  communityId: string;
  title?: string;
  body: string;
  tags: string[];
}

@Component({
  selector: 'lc-new-post-modal',
  standalone: true,
  imports: [FormsModule, RouterLink, ColorSelectComponent],
  templateUrl: './new-post-modal.component.html',
  styleUrl: './new-post-modal.component.scss',
})
export class NewPostModalComponent {
  private readonly nav = inject(CommunityNavService);

  /**
   * Only the communities the user has joined — the API refuses a post to any other,
   * so offering them would guarantee a 403. This replaces a private hardcoded list
   * of six group ids, which is why a user-created community could never be posted
   * into.
   *
   * A signal input, not a plain @Input: groupSelectOptions is a computed() over it,
   * and a computed reading a non-reactive field captures its first value and never
   * updates again.
   */
  readonly groups = input.required<CommunityGroup[]>();
  /** Pre-selects the community when opened from a group page. */
  readonly defaultCommunityId = input<string | undefined>(undefined);
  readonly submitting = input(false);
  readonly error = input<string | null>(null);

  readonly close = output<void>();
  readonly posted = output<NewPostData>();

  readonly selectedName = signal('');

  readonly groupSelectOptions = computed<ColorSelectOption[]>(() =>
    this.groups().map(g => ({ value: g.name, accent: g.accent || 'var(--color-role-accent)' })),
  );

  /**
   * Whether any community exists at all, as distinct from whether the user has
   * joined one. Telling someone to "join a community" when there are none to join
   * is the dead end this input exists to prevent.
   */
  readonly anyCommunityExists = input(true);
  /** Only patients may found a community; everyone else can only wait for one. */
  readonly canCreate = input(false);

  /** Nothing joined yet, so there is nowhere valid to post. */
  readonly hasNowhereToPost = computed(() => this.groups().length === 0);

  readonly groupsLink = computed(() => this.nav.link('groups'));

  form = { title: '', body: '', tagsRaw: '' };

  constructor() {
    effect(() => {
      const preset = this.groups().find(g => g.id === this.defaultCommunityId());
      if (preset) this.selectedName.set(preset.name);
    });
  }

  onOverlayClick(e: MouseEvent): void {
    if ((e.target as HTMLElement).classList.contains('npm-overlay')) this.close.emit();
  }

  submit(f: NgForm): void {
    const group = this.groups().find(g => g.name === this.selectedName());
    if (f.invalid || !group || this.submitting()) return;

    const tags = this.form.tagsRaw
      .split(',')
      .map(t => t.trim().replace(/^#/, ''))
      .filter(t => t.length > 0)
      .slice(0, 8);

    this.posted.emit({
      communityId: group.id,
      title: this.form.title.trim() || undefined,
      body: this.form.body.trim(),
      tags,
    });
    // Deliberately does NOT close here: a 422 or a 403 would otherwise discard
    // everything the user typed. The parent closes it once the API accepts.
  }
}
