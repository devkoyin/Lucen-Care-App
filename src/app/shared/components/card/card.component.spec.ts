import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CardComponent } from './card.component';

describe('CardComponent', () => {
  let fixture: ComponentFixture<CardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [CardComponent] }).compileComponents();
    fixture = TestBed.createComponent(CardComponent);
  });

  it('creates', () => expect(fixture.componentInstance).toBeTruthy());

  it('renders a div with class card', () => {
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.card')).toBeTruthy();
  });

  it('adds card--bordered class when bordered is true', () => {
    fixture.componentInstance.bordered = true;
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.card').classList).toContain('card--bordered');
  });
});
