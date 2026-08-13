import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReasonNoteComponent } from './reason-note.component';

/** Host needed because the reason is passed as projected content. */
@Component({
  standalone: true,
  imports: [ReasonNoteComponent],
  template: `<lc-reason-note [label]="label">{{ reason }}</lc-reason-note>`,
})
class HostComponent {
  label = 'Rejection reason:';
  reason = 'Registration number could not be verified';
}

describe('ReasonNoteComponent', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;

  beforeEach(async () => {
    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({ imports: [HostComponent] }).compileComponents();
    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('creates', () => {
    expect(fixture.nativeElement.querySelector('.reason-note')).not.toBeNull();
  });

  it('renders the label and the projected reason together', () => {
    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Rejection reason:');
    expect(text).toContain('Registration number could not be verified');
  });

  it('defaults the label to the copy the admin screens use', () => {
    const standalone = TestBed.createComponent(ReasonNoteComponent);
    standalone.detectChanges();
    expect(standalone.componentInstance.label).toBe('Rejection reason:');
    expect(standalone.nativeElement.querySelector('.reason-note__label').textContent.trim())
      .toBe('Rejection reason:');
  });

  it('honours a custom label', () => {
    host.label = 'Why this was declined:';
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.reason-note__label').textContent.trim())
      .toBe('Why this was declined:');
  });

  // Screen readers should announce this as an aside, not as page content.
  it('marks the note with role="note"', () => {
    expect(fixture.nativeElement.querySelector('[role="note"]')).not.toBeNull();
  });
});
