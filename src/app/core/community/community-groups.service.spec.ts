import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';

import { CommunityGroupsService } from './community-groups.service';
import { CommunityGroup } from './community.models';
import { environment } from '../../../environments/environment';

const COMMUNITIES = `${environment.apiUrl}/community/communities`;

function group(over: Partial<CommunityGroup> = {}): CommunityGroup {
  return {
    id: 'C1',
    slug: 'diabetes-support',
    name: 'Diabetes Support',
    description: 'Peer support',
    icon: '🩺',
    accent: '#D97706',
    tags: [],
    status: 'active',
    memberCount: 12,
    postCount: 3,
    joined: false,
    createdAt: new Date().toISOString(),
    ...over,
  };
}

describe('CommunityGroupsService', () => {
  let svc: CommunityGroupsService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ imports: [HttpClientTestingModule] });
    svc = TestBed.inject(CommunityGroupsService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  function load(rows: CommunityGroup[]) {
    svc.load().subscribe();
    http.expectOne(r => r.url === COMMUNITIES).flush({ data: rows, meta: {}, traceId: 't' });
  }

  it('partitions joined from the rest', () => {
    load([group({ id: 'A', joined: true }), group({ id: 'B', joined: false })]);
    expect(svc.joinedGroups().map(g => g.id)).toEqual(['A']);
    expect(svc.otherGroups().map(g => g.id)).toEqual(['B']);
  });

  // Not optimistic: the member count belongs to the server, and this is one
  // deliberate click rather than a tap that must feel instant.
  it('takes the server’s membership and count on join', () => {
    load([group({ id: 'C1', joined: false, memberCount: 12 })]);

    svc.join('C1').subscribe();
    const req = http.expectOne(`${COMMUNITIES}/C1/join`);
    expect(req.request.method).toBe('POST');
    req.flush({ data: { joined: true, memberCount: 13 }, traceId: 't' });

    expect(svc.groups()[0].joined).toBeTrue();
    expect(svc.groups()[0].memberCount).toBe(13);
  });

  it('DELETEs on leave and takes the server’s count', () => {
    load([group({ id: 'C1', joined: true, memberCount: 13 })]);

    svc.leave('C1').subscribe();
    const req = http.expectOne(`${COMMUNITIES}/C1/join`);
    expect(req.request.method).toBe('DELETE');
    req.flush({ data: { joined: false, memberCount: 12 }, traceId: 't' });

    expect(svc.groups()[0].joined).toBeFalse();
    expect(svc.groups()[0].memberCount).toBe(12);
  });

  // The create modal has always collected a description; the old handler read the
  // name, icon and accent and dropped it on the floor.
  it('sends the description through to the API', () => {
    svc.create({ name: 'Heart Health', icon: '❤️', accent: '#DC2626', description: 'For cardiac patients' }).subscribe();

    const req = http.expectOne(COMMUNITIES);
    expect(req.request.method).toBe('POST');
    expect(req.request.body.description).toBe('For cardiac patients');
    req.flush({ data: group({ id: 'NEW', name: 'Heart Health' }), traceId: 't' });

    expect(svc.groups()[0].id).toBe('NEW');
  });

  // Renamed from loadAll(), which also fetched /community/overview. The portal
  // strip now renders per-user numbers from /community/stats, so that second call
  // is gone — http.verify() in afterEach is what proves it is not made.
  it('loadGroups fetches the groups and clears the loading flag', () => {
    svc.loadGroups().subscribe();
    expect(svc.loading()).toBeTrue();

    http.expectOne(r => r.url === COMMUNITIES).flush({ data: [group()], meta: {}, traceId: 't' });

    expect(svc.groups()[0].id).toBe('C1');
    expect(svc.loading()).toBeFalse();
  });
});
