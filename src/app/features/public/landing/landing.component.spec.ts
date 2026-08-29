import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { environment } from '../../../../environments/environment';
import { LandingComponent } from './landing.component';

const STATS_URL = `${environment.apiUrl}/public/stats`;

describe('LandingComponent', () => {
  let fixture: ComponentFixture<LandingComponent>;
  let http: HttpTestingController;

  /** Answers the stats call ngOnInit fires, then re-renders. */
  const flushStats = (patients: number, ngoPrograms: number) => {
    http.expectOne(STATS_URL).flush({ data: { patients, ngoPrograms }, traceId: 't' });
    fixture.detectChanges();
  };

  const failStats = () => {
    http.expectOne(STATS_URL).flush('nope', { status: 503, statusText: 'Service Unavailable' });
    fixture.detectChanges();
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, LandingComponent],
      providers: [provideRouter([])],
    }).compileComponents();
    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(LandingComponent);
    fixture.detectChanges();
  });

  it('creates', () => expect(fixture.componentInstance).toBeTruthy());

  describe('platform stats', () => {
    it('shows a skeleton, not a number, until the counts arrive', () => {
      const el = fixture.nativeElement;
      expect(el.querySelector('.brand-panel__stat-n--loading')).toBeTruthy();
      expect(el.querySelector('.brand-panel__stats')?.textContent).not.toContain('+');

      flushStats(12, 4);
    });

    it('renders the live counts once they arrive', () => {
      flushStats(12, 4);

      const text = fixture.nativeElement.querySelector('.brand-panel__stats').textContent;
      expect(text).toContain('12+');
      expect(text).toContain('4+');
      expect(fixture.nativeElement.querySelector('.brand-panel__stat-n--loading')).toBeNull();
    });

    // An empty frame reads as a broken page, so the row goes rather than
    // sitting there with nothing in it.
    it('removes the stats row entirely if the request fails', () => {
      failStats();

      expect(fixture.nativeElement.querySelector('.brand-panel__stats')).toBeNull();
    });

    // Zero is a real answer, not a missing one — it must not be mistaken for
    // the loading state.
    it('renders a zero count rather than falling back to the skeleton', () => {
      flushStats(0, 0);

      expect(fixture.nativeElement.querySelector('.brand-panel__stats').textContent).toContain('0+');
      expect(fixture.nativeElement.querySelector('.brand-panel__stat-n--loading')).toBeNull();
    });
  });

  it('renders the hero headline', () => {
    const h1 = fixture.nativeElement.querySelector('.brand-panel__hed');
    expect(h1).toBeTruthy();
  });

  // Four, not five: the HMO card is temporarily hidden — see landing.component.ts.
  it('renders all four public role buttons', () => {
    const cards = fixture.nativeElement.querySelectorAll('.role-btn');
    expect(cards.length).toBe(4);
  });

  it('does not advertise the admin portal', () => {
    const hrefs: string[] = Array.from(
      fixture.nativeElement.querySelectorAll('.role-btn') as NodeListOf<HTMLAnchorElement>,
      (a: HTMLAnchorElement) => a.getAttribute('href') ?? '',
    );
    expect(hrefs.some(h => h.includes('admin'))).toBeFalse();
  });

  it('routes each role button to the correct signup path', () => {
    const cards: NodeListOf<HTMLAnchorElement> = fixture.nativeElement.querySelectorAll('.role-btn');
    const expected = [
      '/auth/patient/signup',
      '/auth/ngo/signup',
      // TEMPORARILY HIDDEN — '/auth/hmo/signup' sat here; restore alongside the
      // HMO role card in landing.component.ts.
      '/auth/professional/signup',
      '/auth/benefactor/signup',
    ];
    // Asserting the length too: forEach over the rendered cards alone would pass
    // happily if a card went missing and the list just got shorter.
    expect(cards.length).toBe(expected.length);
    cards.forEach((card, i) => {
      expect(card.getAttribute('href')).toBe(expected[i]);
    });
  });
});
