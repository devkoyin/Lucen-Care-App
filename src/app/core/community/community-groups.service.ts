import { HttpParams } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, forkJoin } from 'rxjs';
import { map, tap } from 'rxjs/operators';

import { ApiService } from '../api/api.service';
import { WrappedResponse } from '../api/wrapped-response.model';
import { CommunityGroup, CommunityOverview } from './community.models';

@Injectable({ providedIn: 'root' })
export class CommunityGroupsService {
  private readonly api = inject(ApiService);

  private readonly _groups = signal<CommunityGroup[]>([]);
  private readonly _overview = signal<CommunityOverview | null>(null);
  private readonly _loading = signal(false);

  readonly groups = this._groups.asReadonly();
  readonly overview = this._overview.asReadonly();
  readonly loading = this._loading.asReadonly();

  readonly joinedGroups = computed(() => this._groups().filter(g => g.joined));
  readonly otherGroups = computed(() => this._groups().filter(g => !g.joined));

  /** The portal shell needs the tiles and the tabs need the groups, so fetch both. */
  loadAll(): Observable<[CommunityGroup[], CommunityOverview]> {
    this._loading.set(true);
    return forkJoin([this.load(), this.loadOverview()]).pipe(
      tap({
        next: () => this._loading.set(false),
        error: () => this._loading.set(false),
      }),
    );
  }

  load(limit = 50): Observable<CommunityGroup[]> {
    return this.api
      .get<WrappedResponse<CommunityGroup[]>>('/community/communities', new HttpParams().set('limit', limit))
      .pipe(
        map(r => r.data),
        tap(groups => this._groups.set(groups)),
      );
  }

  loadOverview(): Observable<CommunityOverview> {
    return this.api
      .getData<CommunityOverview>('/community/overview')
      .pipe(tap(o => this._overview.set(o)));
  }

  /** Used by the group page, which may be deep-linked to a group not in the list. */
  get(id: string): Observable<CommunityGroup> {
    return this.api.getData<CommunityGroup>(`/community/communities/${id}`).pipe(tap(g => this.upsert(g)));
  }

  create(payload: {
    name: string;
    description?: string;
    icon?: string;
    accent?: string;
    tags?: string[];
  }): Observable<CommunityGroup> {
    return this.api
      .postData<CommunityGroup>('/community/communities', payload)
      .pipe(tap(g => this._groups.update(list => [g, ...list])));
  }

  /**
   * Join and leave are deliberately NOT optimistic. They are one considered click,
   * they change which section the card sits in, and the member count they return is
   * the server's — the same reasoning behind NotificationsService.markRead patching
   * from the response rather than guessing.
   */
  join(id: string): Observable<{ joined: boolean; memberCount: number }> {
    return this.api
      .postData<{ joined: boolean; memberCount: number }>(`/community/communities/${id}/join`, {})
      .pipe(tap(r => this.patchMembership(id, r.joined, r.memberCount)));
  }

  leave(id: string): Observable<{ joined: boolean; memberCount: number }> {
    return this.api
      .delete<WrappedResponse<{ joined: boolean; memberCount: number }>>(`/community/communities/${id}/join`)
      .pipe(
        map(r => r.data),
        tap(r => this.patchMembership(id, r.joined, r.memberCount)),
      );
  }

  private patchMembership(id: string, joined: boolean, memberCount: number): void {
    this._groups.update(list => list.map(g => (g.id === id ? { ...g, joined, memberCount } : g)));
  }

  private upsert(group: CommunityGroup): void {
    this._groups.update(list =>
      list.some(g => g.id === group.id) ? list.map(g => (g.id === group.id ? group : g)) : [...list, group],
    );
  }
}
