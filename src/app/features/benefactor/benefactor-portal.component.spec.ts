import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { BenefactorPortalComponent } from './benefactor-portal.component';

describe('BenefactorPortalComponent', () => {
  let fixture: ComponentFixture<BenefactorPortalComponent>;
  let component: BenefactorPortalComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BenefactorPortalComponent],
      providers: [provideRouter([])],
    }).compileComponents();
    fixture = TestBed.createComponent(BenefactorPortalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('creates', () => expect(component).toBeTruthy());

  it('exposes Dashboard, Community, and My Profile in the nav', () => {
    const labels = component.navItems.map(i => i.label);
    expect(labels).toEqual(['Dashboard', 'Community', 'My Profile']);
  });
});
