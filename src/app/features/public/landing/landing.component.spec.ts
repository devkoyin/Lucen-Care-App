import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { LandingComponent } from './landing.component';

describe('LandingComponent', () => {
  let fixture: ComponentFixture<LandingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LandingComponent],
      providers: [provideRouter([])],
    }).compileComponents();
    fixture = TestBed.createComponent(LandingComponent);
    fixture.detectChanges();
  });

  it('creates', () => expect(fixture.componentInstance).toBeTruthy());

  it('renders the hero headline', () => {
    const h1 = fixture.nativeElement.querySelector('.hero__headline');
    expect(h1).toBeTruthy();
  });

  it('renders all four role cards', () => {
    const cards = fixture.nativeElement.querySelectorAll('.role-card');
    expect(cards.length).toBe(4);
  });

  it('renders Find My Path CTA', () => {
    const cta = fixture.nativeElement.querySelector('[data-testid="cta-find-path"]');
    expect(cta).toBeTruthy();
  });

  it('routes each role card to the correct signup path', () => {
    const cards: NodeListOf<HTMLAnchorElement> = fixture.nativeElement.querySelectorAll('.role-card');
    const expected = ['/auth/patient/signup', '/auth/ngo/signup', '/auth/hmo/signup', '/auth/researcher/signup'];
    cards.forEach((card, i) => {
      expect(card.getAttribute('href')).toBe(expected[i]);
    });
  });
});
