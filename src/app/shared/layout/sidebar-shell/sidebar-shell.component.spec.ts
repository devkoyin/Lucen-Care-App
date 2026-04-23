import { ComponentFixture, TestBed } from '@angular/core/testing';
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
      imports: [SidebarShellComponent],
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
});
