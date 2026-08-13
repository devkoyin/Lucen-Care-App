import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { SidebarShellComponent, NavItem } from './sidebar-shell.component';

describe('SidebarShellComponent', () => {
  let fixture: ComponentFixture<SidebarShellComponent>;
  let component: SidebarShellComponent;

  const mockNavItems: NavItem[] = [
    { icon: '🏠', label: 'Dashboard', route: '/patient/dashboard' },
    { icon: '💊', label: 'Medications', route: '/patient/medications' },
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, SidebarShellComponent],
      providers: [provideRouter([])],
    }).compileComponents();
    fixture = TestBed.createComponent(SidebarShellComponent);
    component = fixture.componentInstance;
    component.portalLabel = 'Patient Portal';
    component.userName = 'Ada Okonkwo';
    component.userRole = 'Patient';
    component.portalClass = 'portal-patient';
    component.navItems = mockNavItems;
    fixture.detectChanges();
  });

  it('creates', () => expect(component).toBeTruthy());

  it('renders the portal label', () => {
    expect(fixture.nativeElement.querySelector('.sidebar__role-label').textContent.trim())
      .toBe('Patient Portal');
  });

  it('renders nav items', () => {
    expect(fixture.nativeElement.querySelectorAll('.nav-item').length).toBeGreaterThanOrEqual(2);
  });

  it('renders the user name', () => {
    expect(fixture.nativeElement.querySelector('.sidebar__user-name').textContent.trim())
      .toBe('Ada Okonkwo');
  });

  it('applies the portalClass to the shell wrapper', () => {
    const shell: HTMLElement = fixture.nativeElement.querySelector('.shell');
    expect(shell.classList).toContain('portal-patient');
  });

  // The shell wraps every routed page, so anything it does to a click it does to
  // the whole app. `(click)="menuOpen() && closeMenu()"` evaluated to false with
  // the menu shut, and Angular preventDefault()s a listener that returns false —
  // which silently cancelled form submits on every page inside the portal.
  describe('clicks in the routed page area', () => {
    function clickInMain(): Event {
      const main: HTMLElement = fixture.nativeElement.querySelector('.shell__main');
      const event = new MouseEvent('click', { bubbles: true, cancelable: true });
      main.dispatchEvent(event);
      return event;
    }

    it('does not preventDefault when the mobile menu is closed', () => {
      expect(component.menuOpen()).toBeFalse();
      expect(clickInMain().defaultPrevented).toBeFalse();
    });

    it('still does not preventDefault while closing an open menu', () => {
      component.toggleMenu();
      fixture.detectChanges();

      const event = clickInMain();

      expect(component.menuOpen()).toBeFalse();
      expect(event.defaultPrevented).toBeFalse();
    });
  });
});
