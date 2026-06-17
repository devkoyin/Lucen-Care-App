import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AdminPortalComponent } from './admin-portal.component';

describe('AdminPortalComponent', () => {
  let fixture: ComponentFixture<AdminPortalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminPortalComponent],
      providers: [provideRouter([])],
    }).compileComponents();
    fixture = TestBed.createComponent(AdminPortalComponent);
    fixture.detectChanges();
  });

  it('creates', () => expect(fixture.componentInstance).toBeTruthy());

  it('includes a nav item for professional approvals', () => {
    const item = fixture.componentInstance.navItems.find(i => i.route === '/admin/professional-approvals');
    expect(item?.label).toBe('Professional Approvals');
  });
});
