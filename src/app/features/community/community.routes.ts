import { Routes } from '@angular/router';

/**
 * One route config, consumed by all three portals that expose a community.
 *
 * Each role's route file supplies its own `communityBase` in route data, which
 * CommunityPortalComponent hands to CommunityNavService so in-feature links resolve
 * under the right prefix. Before this, professional and benefactor lazy-loaded the
 * bare feed component directly: no portal shell, no groups, no trending, and every
 * link inside it pointing at /patient/*.
 */
export const COMMUNITY_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./community-portal.component').then(m => m.CommunityPortalComponent),
    children: [
      { path: '', redirectTo: 'feed', pathMatch: 'full' },
      {
        path: 'feed',
        loadComponent: () => import('./community.component').then(m => m.CommunityComponent),
      },
      {
        path: 'groups',
        loadComponent: () =>
          import('./groups-list/groups-list.component').then(m => m.GroupsListComponent),
      },
      {
        path: 'trending',
        loadComponent: () => import('./trending/trending.component').then(m => m.TrendingComponent),
      },
      {
        path: 'group/:id',
        loadComponent: () =>
          import('./group/community-group.component').then(m => m.CommunityGroupComponent),
      },
      {
        // A real route rather than a modal: the professional's Answer button, both
        // My Posts tabs, the benefactor's View Thread and reply notifications all
        // need to link into a thread from outside this feature, and only a URL
        // crosses that boundary.
        path: 'post/:id',
        loadComponent: () =>
          import('./post/post-detail.component').then(m => m.PostDetailComponent),
      },
    ],
  },
];
