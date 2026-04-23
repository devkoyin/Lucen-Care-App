import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BadgeComponent } from './badge.component';

describe('BadgeComponent', () => {
  let fixture: ComponentFixture<BadgeComponent>;
  let component: BadgeComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [BadgeComponent] }).compileComponents();
    fixture = TestBed.createComponent(BadgeComponent);
    component = fixture.componentInstance;
  });

  it('creates', () => expect(component).toBeTruthy());

  it('applies badge--success class by default', () => {
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('span').classList).toContain('badge--success');
  });

  it('applies badge--warning class when color is warning', () => {
    component.color = 'warning';
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('span').classList).toContain('badge--warning');
  });

  it('applies badge--error class when color is error', () => {
    component.color = 'error';
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('span').classList).toContain('badge--error');
  });
});
