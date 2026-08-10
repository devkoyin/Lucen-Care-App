import { TestBed } from '@angular/core/testing';

import { CommunityNavService } from './community-nav.service';

/**
 * The base-path resolver. Nine hardcoded `/patient/community/...` links used to sit
 * in this feature; the moment a professional loaded the same components, every one
 * of them navigated out of their portal into roleGuard('patient').
 */
describe('CommunityNavService', () => {
  let nav: CommunityNavService;

  beforeEach(() => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({});
    nav = TestBed.inject(CommunityNavService);
  });

  it('defaults to the patient portal', () => {
    expect(nav.link('feed')).toEqual(['/patient/community', 'feed']);
  });

  it('resolves under whichever portal set the base', () => {
    nav.setBase('/professional/community');
    expect(nav.link('post', 'P1')).toEqual(['/professional/community', 'post', 'P1']);

    nav.setBase('/benefactor/community');
    expect(nav.link('group', 'G1')).toEqual(['/benefactor/community', 'group', 'G1']);
  });

  // Route data is absent on any route that forgot to declare it; falling back beats
  // producing a link to `undefined/...`.
  it('ignores an undefined base rather than corrupting the prefix', () => {
    nav.setBase('/professional/community');
    nav.setBase(undefined);
    expect(nav.link('feed')).toEqual(['/professional/community', 'feed']);
  });
});
