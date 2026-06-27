import { Component, computed, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommunityGroup, SEED_GROUPS } from '../community.data';
import { CreateCommunityModalComponent, CreateCommunityData } from '../create-community-modal.component';

@Component({
  selector: 'lc-groups-list',
  standalone: true,
  imports: [RouterLink, CreateCommunityModalComponent],
  templateUrl: './groups-list.component.html',
  styleUrl: './groups-list.component.scss',
})
export class GroupsListComponent {
  readonly showCreateCommunity = signal(false);
  readonly groups = signal<CommunityGroup[]>(SEED_GROUPS);

  readonly joinedGroups = computed(() => this.groups().filter(g => g.joined));
  readonly otherGroups = computed(() => this.groups().filter(g => !g.joined));

  toggleJoin(groupId: string): void {
    this.groups.update(list =>
      list.map(g => g.id === groupId ? { ...g, joined: !g.joined } : g)
    );
  }

  createCommunity(data: CreateCommunityData): void {
    this.groups.update(list => [{
      id: 'user-' + Date.now(),
      name: data.name,
      icon: data.icon,
      accent: data.accent,
      members: 1,
      joined: true,
    }, ...list]);
  }
}
