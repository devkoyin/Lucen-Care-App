import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ProfessionalPortalComponent } from './professional-portal.component';

describe('ProfessionalPortalComponent', () => {
  let fixture: ComponentFixture<ProfessionalPortalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProfessionalPortalComponent],
      providers: [provideRouter([])],
    }).compileComponents();
    fixture = TestBed.createComponent(ProfessionalPortalComponent);
    fixture.detectChanges();
  });

  it('creates', () => expect(fixture.componentInstance).toBeTruthy());

  it('only exposes Community and My Profile in the nav — no dashboard or funding', () => {
    const labels = fixture.componentInstance.navItems.map(i => i.label);
    expect(labels).toEqual(['Community', 'My Profile']);
  });
});
