import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { LandingComponent } from './landing.component';

describe('LandingComponent', () => {
  let fixture: ComponentFixture<LandingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, LandingComponent],
      providers: [provideRouter([])],
    }).compileComponents();
    fixture = TestBed.createComponent(LandingComponent);
    fixture.detectChanges();
  });

  it('creates', () => expect(fixture.componentInstance).toBeTruthy());

  it('renders the hero headline', () => {
    const h1 = fixture.nativeElement.querySelector('.brand-panel__hed');
    expect(h1).toBeTruthy();
  });

  it('renders all five public role buttons', () => {
    const cards = fixture.nativeElement.querySelectorAll('.role-btn');
    expect(cards.length).toBe(5);
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
      '/auth/hmo/signup',
      '/auth/professional/signup',
      '/auth/benefactor/signup',
    ];
    cards.forEach((card, i) => {
      expect(card.getAttribute('href')).toBe(expected[i]);
    });
  });
});
