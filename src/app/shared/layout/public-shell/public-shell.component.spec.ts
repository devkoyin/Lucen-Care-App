import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { PublicShellComponent } from './public-shell.component';

describe('PublicShellComponent', () => {
  let fixture: ComponentFixture<PublicShellComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PublicShellComponent],
      providers: [provideRouter([])],
    }).compileComponents();
    fixture = TestBed.createComponent(PublicShellComponent);
    fixture.detectChanges();
  });

  it('creates', () => expect(fixture.componentInstance).toBeTruthy());
  it('renders nav with brand name', () => {
    expect(fixture.nativeElement.querySelector('.nav__brand').textContent.trim()).toBe('LUCEN CARE');
  });
  it('renders a router-outlet', () => {
    expect(fixture.nativeElement.querySelector('router-outlet')).toBeTruthy();
  });
});
