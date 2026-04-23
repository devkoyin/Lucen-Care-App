import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RoleSelectionComponent } from './role-selection.component';

describe('RoleSelectionComponent', () => {
  let fixture: ComponentFixture<RoleSelectionComponent>;
  let component: RoleSelectionComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RoleSelectionComponent],
      providers: [provideRouter([])],
    }).compileComponents();
    fixture = TestBed.createComponent(RoleSelectionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('creates', () => expect(component).toBeTruthy());

  it('renders 4 role options', () => {
    expect(fixture.nativeElement.querySelectorAll('.role-option').length).toBe(4);
  });

  it('has no role selected initially', () => {
    expect(component.selectedRole).toBeNull();
  });

  it('updates selectedRole when selectRole is called', () => {
    component.selectRole('patient');
    expect(component.selectedRole).toBe('patient');
  });

  it('CTA label reflects selected role', () => {
    component.selectRole('ngo');
    fixture.detectChanges();
    const cta = fixture.nativeElement.querySelector('[data-testid="role-cta"]');
    expect(cta.textContent.trim()).toContain('NGO');
  });

  it('CTA is disabled when no role is selected', () => {
    const cta: HTMLButtonElement = fixture.nativeElement.querySelector('[data-testid="role-cta"]');
    expect(cta.disabled).toBeTrue();
  });
});
