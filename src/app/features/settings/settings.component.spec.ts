import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';

import { SettingsComponent, SettingsModule } from './settings.component';

const MODULES: SettingsModule[] = [
  { icon: '🔒', label: 'Privacy & Sharing', description: 'Choose who can see your health information.', route: '/patient/settings/privacy' },
  { icon: '👤', label: 'My Profile',        description: 'Your name, contact details and where you live.', route: '/patient/settings/profile' },
];

describe('SettingsComponent', () => {
  let fixture: ComponentFixture<SettingsComponent>;

  function setup(data: Record<string, unknown>) {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [SettingsComponent],
      providers: [
        provideRouter([]),
        { provide: ActivatedRoute, useValue: { snapshot: { data } } },
      ],
    });
    fixture = TestBed.createComponent(SettingsComponent);
    fixture.detectChanges();
  }

  function rows(): HTMLAnchorElement[] {
    return Array.from(fixture.nativeElement.querySelectorAll('.settings-row'));
  }

  it('renders one row per module in route data', () => {
    setup({ modules: MODULES });
    expect(rows().length).toBe(2);
  });

  it('renders each module label, description and link', () => {
    setup({ modules: MODULES });
    const [privacy, profile] = rows();

    expect(privacy.querySelector('.settings-row__label')?.textContent?.trim()).toBe('Privacy & Sharing');
    expect(privacy.querySelector('.settings-row__desc')?.textContent?.trim())
      .toBe('Choose who can see your health information.');
    expect(privacy.getAttribute('href')).toBe('/patient/settings/privacy');
    expect(profile.getAttribute('href')).toBe('/patient/settings/profile');
  });

  // A portal that registers the landing without declaring modules should render
  // an empty list, not blow up on an undefined @for source.
  it('renders no rows when the route declares no modules', () => {
    setup({});
    expect(rows().length).toBe(0);
  });
});
