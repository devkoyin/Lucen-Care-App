import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { signal } from '@angular/core';
import { CommunityComponent } from './community.component';
import { AuthService } from '../../../core/auth/auth.service';
import { MeResponse, User } from '../../../core/auth/auth.models';

const NEW_POST = {
  groupId: 'diabetes',
  groupLabel: 'Diabetes Support',
  groupColor: '#D97706',
  title: 'Title',
  content: 'Content',
  tags: [],
};

describe('CommunityComponent', () => {
  let fixture: ComponentFixture<CommunityComponent>;
  let component: CommunityComponent;

  /**
   * Verified badges are driven by the server's view of the application
   * (AuthService.meState), populated by GET /auth/me.
   */
  function setup(user: User | null, me: MeResponse | null = null): void {
    const authSpy = jasmine.createSpyObj<AuthService>(
      'AuthService',
      ['login', 'signup', 'signOut', 'isAuthenticated', 'role'],
      { user: signal(user), meState: signal(me) },
    );
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, CommunityComponent],
      providers: [{ provide: AuthService, useValue: authSpy }],
    });
    fixture = TestBed.createComponent(CommunityComponent);
    component = fixture.componentInstance;
  }

  it('creates', () => {
    setup(null);
    expect(component).toBeTruthy();
  });

  it('tags a new post from an approved professional with the verified badge', () => {
    const user: User = { id: '1', role: 'professional', name: 'Dr. Jane Doe', email: 'jane@doe.com', status: 'active' };
    setup(user, {
      id: '1', email: 'jane@doe.com', role: 'professional', status: 'active', name: 'Dr. Jane Doe',
      application: { id: 'APP1', status: 'approved', submittedAt: '2026-01-01', specialty: 'Cardiology' },
    });

    component.addPost(NEW_POST);

    const post = component.posts()[0];
    expect(post.authorBadge).toBe('verified-professional');
    expect(post.authorSpecialty).toBe('Cardiology');
    expect(post.author).toBe('Dr. Jane Doe');
  });

  it('does not tag a post from a patient', () => {
    const user: User = { id: '2', role: 'patient', name: 'Amaka', email: 'amaka@test.com', status: 'active' };
    setup(user, { id: '2', email: 'amaka@test.com', role: 'patient', status: 'active', name: 'Amaka' });

    component.addPost(NEW_POST);
    expect(component.posts()[0].authorBadge).toBeUndefined();
  });

  it('does not tag a post from a professional whose application is still pending', () => {
    const user: User = { id: '1', role: 'professional', name: 'Dr. Jane Doe', email: 'jane@doe.com', status: 'pending' };
    setup(user, {
      id: '1', email: 'jane@doe.com', role: 'professional', status: 'pending', name: 'Dr. Jane Doe',
      application: { id: 'APP1', status: 'pending', submittedAt: '2026-01-01', specialty: 'Cardiology' },
    });

    component.addPost(NEW_POST);
    expect(component.posts()[0].authorBadge).toBeUndefined();
  });

  it('tags a new post from an approved benefactor with the verified-benefactor badge', () => {
    const user: User = { id: '3', role: 'benefactor', name: 'Ada Obi', email: 'ada@test.com', status: 'active' };
    setup(user, {
      id: '3', email: 'ada@test.com', role: 'benefactor', status: 'active', name: 'Ada Obi',
      application: { id: 'BEN1', status: 'approved', submittedAt: '2026-01-01' },
    });

    component.addPost({ ...NEW_POST, groupId: 'wellness', groupLabel: 'General Wellness', groupColor: '#059669' });

    const post = component.posts()[0];
    expect(post.authorBadge).toBe('verified-benefactor');
    expect(post.author).toBe('Ada Obi');
  });

  it('does not tag a benefactor post when their application is still pending', () => {
    const user: User = { id: '3', role: 'benefactor', name: 'Ada Obi', email: 'ada@test.com', status: 'pending' };
    setup(user, {
      id: '3', email: 'ada@test.com', role: 'benefactor', status: 'pending', name: 'Ada Obi',
      application: { id: 'BEN1', status: 'pending', submittedAt: '2026-01-01' },
    });

    component.addPost({ ...NEW_POST, groupId: 'wellness', groupLabel: 'General Wellness', groupColor: '#059669' });
    expect(component.posts()[0].authorBadge).toBeUndefined();
  });

  // /auth/me has not resolved yet — fall back to the cached user, unbadged.
  it('does not tag a post before /auth/me resolves', () => {
    const user: User = { id: '1', role: 'professional', name: 'Dr. Jane Doe', email: 'jane@doe.com', status: 'active' };
    setup(user, null);

    component.addPost(NEW_POST);
    const post = component.posts()[0];
    expect(post.authorBadge).toBeUndefined();
    expect(post.author).toBe('Dr. Jane Doe');
  });
});
