import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';

import { BackLinkComponent } from './back-link.component';

@Component({
  selector: 'lc-test-module-page',
  standalone: true,
  imports: [BackLinkComponent],
  template: `<lc-back-link [label]="label" />`,
})
class TestModulePageComponent {
  label = 'Settings';
}

@Component({ selector: 'lc-test-landing', standalone: true, template: 'landing' })
class TestLandingComponent {}

describe('BackLinkComponent', () => {
  /** Mirrors the real shape: a landing at '' with each module one level under it. */
  async function navigateTo(url: string) {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        provideRouter([
          {
            path: 'settings',
            children: [
              { path: '', component: TestLandingComponent },
              { path: 'privacy', component: TestModulePageComponent },
            ],
          },
        ]),
      ],
    });
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl(url);
    harness.detectChanges();
    return harness;
  }

  it('points one level up, at the settings landing', async () => {
    const harness = await navigateTo('/settings/privacy');
    const link: HTMLAnchorElement = harness.routeNativeElement!.querySelector('.back-link')!;

    expect(link.getAttribute('href')).toBe('/settings');
  });

  it('renders the label with a back arrow', async () => {
    const harness = await navigateTo('/settings/privacy');
    const link: HTMLAnchorElement = harness.routeNativeElement!.querySelector('.back-link')!;

    expect(link.textContent!.trim()).toBe('←Settings');
  });
});
