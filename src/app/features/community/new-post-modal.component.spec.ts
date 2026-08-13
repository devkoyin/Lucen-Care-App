import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { NewPostData, NewPostModalComponent } from './new-post-modal.component';
import { CommunityNavService } from './community-nav.service';
import { CommunityGroup } from '../../core/community/community.models';

function group(over: Partial<CommunityGroup> = {}): CommunityGroup {
  return {
    id: 'C1',
    slug: 'diabetes-support',
    name: 'Diabetes Support',
    icon: '🩺',
    accent: '#D97706',
    tags: [],
    status: 'active',
    memberCount: 12,
    postCount: 3,
    joined: true,
    createdAt: new Date().toISOString(),
    ...over,
  };
}

describe('NewPostModalComponent', () => {
  let fixture: ComponentFixture<NewPostModalComponent>;
  let component: NewPostModalComponent;

  beforeEach(async () => {
    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [NewPostModalComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(NewPostModalComponent);
    component = fixture.componentInstance;
  });

  function render(
    groups: CommunityGroup[],
    defaultCommunityId?: string,
    opts: { anyCommunityExists?: boolean; canCreate?: boolean } = {},
  ) {
    fixture.componentRef.setInput('groups', groups);
    if (defaultCommunityId) fixture.componentRef.setInput('defaultCommunityId', defaultCommunityId);
    fixture.componentRef.setInput('anyCommunityExists', opts.anyCommunityExists ?? true);
    fixture.componentRef.setInput('canCreate', opts.canCreate ?? false);
    fixture.detectChanges();
    return fixture.nativeElement.textContent as string;
  }

  // "Join a community" is useless advice when there are none to join, and worse
  // for someone who is not allowed to create one. Three states, one per situation.
  describe('when no community exists at all', () => {
    it('invites a patient to found the first one', () => {
      const text = render([], undefined, { anyCommunityExists: false, canCreate: true });

      expect(text).toContain('There are no communities yet');
      expect(text).toContain('Create the first community');
      expect(text).not.toContain('Browse communities');
    });

    // Offering "create" to a professional would send them at a 403.
    it('tells a non-patient plainly rather than offering an action that would fail', () => {
      const text = render([], undefined, { anyCommunityExists: false, canCreate: false });

      expect(text).toContain('There are no communities yet');
      expect(text).toContain('started by patients');
      expect(fixture.nativeElement.querySelector('a')).toBeNull();
    });
  });

  // The state every brand-new account lands in once the starter set exists.
  describe('when the user has joined nothing', () => {
    it('explains itself instead of showing an unusable form', () => {
      const text = render([]);

      expect(text).toContain('Join a community before posting');
      expect(fixture.nativeElement.querySelector('form')).toBeNull();
    });

    it('offers a route to the communities list under the active portal', () => {
      TestBed.inject(CommunityNavService).setBase('/professional/community');
      render([]);

      const link = fixture.nativeElement.querySelector('.npm-save-btn') as HTMLAnchorElement;
      expect(link.getAttribute('href')).toBe('/professional/community/groups');
    });

    it('closes itself when that route is taken, so the modal is not left behind', () => {
      render([]);
      let closed = 0;
      component.close.subscribe(() => closed++);

      (fixture.nativeElement.querySelector('.npm-save-btn') as HTMLElement).click();
      expect(closed).toBe(1);
    });
  });

  describe('when the user has joined a community', () => {
    it('shows the form', () => {
      render([group()]);
      expect(fixture.nativeElement.querySelector('form')).not.toBeNull();
    });

    // The group page opens this with its own community fixed.
    it('preselects the community it was opened from', () => {
      render([group({ id: 'C1', name: 'Diabetes Support' })], 'C1');
      expect(component.selectedName()).toBe('Diabetes Support');
    });

    // groupSelectOptions is a computed over the input; as a plain @Input it would
    // have captured the first value and never updated.
    it('tracks a change to the group list', () => {
      render([group({ id: 'C1', name: 'Diabetes Support' })]);
      expect(component.groupSelectOptions().map(o => o.value)).toEqual(['Diabetes Support']);

      fixture.componentRef.setInput('groups', [
        group({ id: 'C1', name: 'Diabetes Support' }),
        group({ id: 'C2', name: 'Heart Health' }),
      ]);
      fixture.detectChanges();

      expect(component.groupSelectOptions().map(o => o.value)).toEqual(['Diabetes Support', 'Heart Health']);
    });

    it('emits the chosen community, a trimmed body and parsed tags', () => {
      render([group({ id: 'C1', name: 'Diabetes Support' })]);
      component.selectedName.set('Diabetes Support');
      component.form.title = '  Metformin  ';
      component.form.body = '  Any tips?  ';
      component.form.tagsRaw = '#Metformin, Diabetes , ,';

      const emitted: NewPostData[] = [];
      component.posted.subscribe(d => emitted.push(d));
      component.submit({ invalid: false } as never);

      expect(emitted[0]).toEqual({
        communityId: 'C1',
        title: 'Metformin',
        body: 'Any tips?',
        tags: ['Metformin', 'Diabetes'],
      });
    });

    // A rejected post must not take the user's text with it.
    it('does not close itself on submit', () => {
      render([group()]);
      let closed = 0;
      component.close.subscribe(() => closed++);

      component.selectedName.set('Diabetes Support');
      component.form.body = 'Any tips?';
      component.submit({ invalid: false } as never);

      expect(closed).toBe(0);
    });

    it('refuses to submit while a post is already in flight', () => {
      fixture.componentRef.setInput('groups', [group()]);
      fixture.componentRef.setInput('submitting', true);
      fixture.detectChanges();

      component.selectedName.set('Diabetes Support');
      component.form.body = 'Any tips?';

      const emitted: NewPostData[] = [];
      component.posted.subscribe(d => emitted.push(d));
      component.submit({ invalid: false } as never);

      expect(emitted.length).toBe(0);
    });
  });
});
