import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormFieldComponent } from './form-field.component';

describe('FormFieldComponent', () => {
  let fixture: ComponentFixture<FormFieldComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FormFieldComponent],
    }).compileComponents();
    fixture = TestBed.createComponent(FormFieldComponent);
  });

  it('creates', () => {
    fixture.componentInstance.label = 'Email';
    fixture.detectChanges();
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('renders the label', () => {
    fixture.componentInstance.label = 'Email address';
    fixture.detectChanges();
    const label = fixture.nativeElement.querySelector('.field__label');
    expect(label.textContent.trim()).toBe('Email address');
  });

  it('shows error message when error is set', () => {
    fixture.componentInstance.label = 'Email';
    fixture.componentInstance.error = 'Email is required';
    fixture.detectChanges();
    const err = fixture.nativeElement.querySelector('.field__error');
    expect(err.textContent.trim()).toBe('Email is required');
  });

  it('adds field--error class when error is set', () => {
    fixture.componentInstance.label = 'Email';
    fixture.componentInstance.error = 'Required';
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.field--error')).toBeTruthy();
  });

  it('shows hint when no error', () => {
    fixture.componentInstance.label = 'Email';
    fixture.componentInstance.hint = 'We will never share your email';
    fixture.detectChanges();
    const hint = fixture.nativeElement.querySelector('.field__hint');
    expect(hint.textContent.trim()).toBe('We will never share your email');
  });

  it('hides hint when error is set', () => {
    fixture.componentInstance.label = 'Email';
    fixture.componentInstance.error = 'Required';
    fixture.componentInstance.hint = 'Some hint';
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.field__hint')).toBeNull();
  });
});
