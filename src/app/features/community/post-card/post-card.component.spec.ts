import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { PostCardComponent } from './post-card.component';
import { CommunityNavService } from '../community-nav.service';
import { CommunityPost } from '../../../core/community/community.models';

function post(over: Partial<CommunityPost> = {}): CommunityPost {
  return {
    id: 'P1',
    communityId: 'C1',
    communityName: 'Diabetes Support',
    communityAccent: '#D97706',
    author: { userId: 'U1', displayName: 'Amaka O.', initial: 'A', verified: false },
    title: 'Metformin side effects',
    body: 'Any tips?',
    tags: ['Metformin'],
    commentCount: 4,
    reactionCount: 2,
    reactedByMe: false,
    createdAt: new Date().toISOString(),
    lastActivityAt: new Date().toISOString(),
    status: 'published',
    visibleToOthers: true,
    ...over,
  };
}

describe('PostCardComponent', () => {
  let fixture: ComponentFixture<PostCardComponent>;
  let component: PostCardComponent;

  beforeEach(async () => {
    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [PostCardComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(PostCardComponent);
    component = fixture.componentInstance;
  });

  function render(p: CommunityPost) {
    fixture.componentRef.setInput('post', p);
    fixture.detectChanges();
    return fixture.nativeElement.textContent as string;
  }

  it('renders the server-supplied display name and initial', () => {
    const text = render(post());
    expect(text).toContain('Amaka O.');
    expect(fixture.nativeElement.querySelector('.post-card__avatar').textContent.trim()).toBe('A');
  });

  describe('badges', () => {
    it('shows the professional badge with the specialty in its tooltip', () => {
      const text = render(
        post({
          author: {
            userId: 'U2',
            displayName: 'Dr Yemi Adekunle',
            initial: 'D',
            verified: true,
            badge: 'verified-professional',
            specialty: 'Endocrinology',
          },
        }),
      );

      expect(text).toContain('Verified Health Professional');
      expect(fixture.nativeElement.querySelector('.post-card__pro-badge').getAttribute('title'))
        .toBe('Verified Health Professional · Endocrinology');
    });

    it('falls back to a plain tooltip when there is no specialty', () => {
      render(post({ author: { userId: 'U2', displayName: 'Dr X', initial: 'D', verified: true, badge: 'verified-professional' } }));
      expect(fixture.nativeElement.querySelector('.post-card__pro-badge').getAttribute('title'))
        .toBe('Verified Health Professional');
    });

    it('shows the benefactor badge', () => {
      const text = render(post({ author: { userId: 'U3', displayName: 'Adunola F', initial: 'A', verified: true, badge: 'verified-benefactor' } }));
      expect(text).toContain('Verified Benefactor');
    });

    it('shows no badge for a plain patient', () => {
      render(post());
      expect(fixture.nativeElement.querySelector('.post-card__pro-badge')).toBeNull();
      expect(fixture.nativeElement.querySelector('.post-card__benefactor-badge')).toBeNull();
    });
  });

  // The author's own copy of removed content. Silent removal is the single largest
  // generator of "the app is broken".
  it('tells the author when their post has been removed, and why', () => {
    const text = render(post({ visibleToOthers: false, status: 'hidden', hiddenReason: 'Contains a phone number' }));
    expect(text).toContain('Removed by a moderator');
    expect(text).toContain('Contains a phone number');
  });

  describe('links resolve under the active portal', () => {
    it('points the comment count at the thread, not nowhere', () => {
      TestBed.inject(CommunityNavService).setBase('/professional/community');
      render(post());

      const links = Array.from(fixture.nativeElement.querySelectorAll('a')) as HTMLAnchorElement[];
      const thread = links.find(a => a.getAttribute('href')?.includes('/post/'));
      expect(thread?.getAttribute('href')).toBe('/professional/community/post/P1');
    });

    it('points the community badge at that community under the same portal', () => {
      TestBed.inject(CommunityNavService).setBase('/benefactor/community');
      render(post());

      const badge = fixture.nativeElement.querySelector('.post-card__group-badge');
      expect(badge.getAttribute('href')).toBe('/benefactor/community/group/C1');
    });

    it('hides the community badge when asked', () => {
      fixture.componentRef.setInput('post', post());
      fixture.componentRef.setInput('showCommunityBadge', false);
      fixture.detectChanges();

      expect(fixture.nativeElement.querySelector('.post-card__group-badge')).toBeNull();
    });
  });

  it('emits react and report rather than acting itself', () => {
    render(post());
    const reacted: CommunityPost[] = [];
    const reported: CommunityPost[] = [];
    component.react.subscribe(p => reacted.push(p));
    component.report.subscribe(p => reported.push(p));

    fixture.nativeElement.querySelector('.post-action-btn').click();
    fixture.nativeElement.querySelector('.post-card__more').click();

    expect(reacted.length).toBe(1);
    expect(reported.length).toBe(1);
  });
});
