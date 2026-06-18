import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
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

  it('renders 6 role options', () => {
    expect(fixture.nativeElement.querySelectorAll('.role-option').length).toBe(6);
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

  it('navigates to the correct signup route when continue() is called', () => {
    const router = TestBed.inject(Router);
    const spy = spyOn(router, 'navigate');
    component.selectRole('hmo');
    component.continue();
    expect(spy).toHaveBeenCalledWith(['/auth', 'hmo', 'signup']);
  });

  it('navigates to the professional signup route when continue() is called', () => {
    const router = TestBed.inject(Router);
    const spy = spyOn(router, 'navigate');
    component.selectRole('professional');
    component.continue();
    expect(spy).toHaveBeenCalledWith(['/auth', 'professional', 'signup']);
  });

  it('navigates to the benefactor signup route when continue() is called', () => {
    const router = TestBed.inject(Router);
    const spy = spyOn(router, 'navigate');
    component.selectRole('benefactor');
    component.continue();
    expect(spy).toHaveBeenCalledWith(['/auth', 'benefactor', 'signup']);
  });

  it('does not navigate when continue() is called with no role selected', () => {
    const router = TestBed.inject(Router);
    const spy = spyOn(router, 'navigate');
    component.continue();
    expect(spy).not.toHaveBeenCalled();
  });
});
