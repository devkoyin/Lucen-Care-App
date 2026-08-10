import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { apiErrorMessage } from '../../../core/api/wrapped-response.model';
import { AuthService } from '../../../core/auth/auth.service';
import { CommunityGroupsService } from '../../../core/community/community-groups.service';
import { CommunityNavService } from '../community-nav.service';
import { CreateCommunityData, CreateCommunityModalComponent } from '../create-community-modal.component';

@Component({
  selector: 'lc-groups-list',
  standalone: true,
  imports: [RouterLink, CreateCommunityModalComponent],
  templateUrl: './groups-list.component.html',
  styleUrl: './groups-list.component.scss',
})
export class GroupsListComponent implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly groups$ = inject(CommunityGroupsService);
  readonly nav = inject(CommunityNavService);

  readonly joinedGroups = this.groups$.joinedGroups;
  readonly otherGroups = this.groups$.otherGroups;

  readonly loading = signal(true);
  readonly loadError = signal(false);
  readonly actionError = signal<string | null>(null);
  /** Only the card being joined or left is disabled, not the whole grid. */
  readonly busyId = signal<string | null>(null);

  readonly showCreateCommunity = signal(false);
  readonly creating = signal(false);
  readonly createError = signal<string | null>(null);

  /**
   * Founding a community is patients-only; the API returns 403 to anyone else.
   * Reads role() (the cached user, available immediately) rather than meState()
   * (a server round-trip) — otherwise a patient loses the create button for as long
   * as GET /auth/me is in flight, which is exactly when the page first renders.
   */
  readonly canCreate = computed(() => this.auth.role() === 'patient');

  ngOnInit(): void {
    this.reload();
  }

  reload(): void {
    this.loading.set(true);
    this.loadError.set(false);
    this.groups$.load().subscribe({
      next: () => this.loading.set(false),
      error: () => {
        this.loading.set(false);
        this.loadError.set(true);
      },
    });
  }

  toggleJoin(id: string, joined: boolean): void {
    this.busyId.set(id);
    this.actionError.set(null);
    const req = joined ? this.groups$.leave(id) : this.groups$.join(id);
    req.subscribe({
      next: () => this.busyId.set(null),
      error: err => {
        this.busyId.set(null);
        this.actionError.set(apiErrorMessage(err));
      },
    });
  }

  createCommunity(data: CreateCommunityData): void {
    this.creating.set(true);
    this.createError.set(null);
    // The description finally reaches the API — the modal has always collected it,
    // and the old handler dropped it on the floor.
    this.groups$
      .create({ name: data.name, icon: data.icon, accent: data.accent, description: data.description })
      .subscribe({
        next: () => {
          this.creating.set(false);
          this.showCreateCommunity.set(false);
        },
        error: err => {
          this.creating.set(false);
          this.createError.set(apiErrorMessage(err));
        },
      });
  }
}
