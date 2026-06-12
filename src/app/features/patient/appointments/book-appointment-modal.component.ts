import { Component, EventEmitter, Output, inject } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { AppointmentsService, ApptType } from './appointments.service';
import { SpecialtySelectComponent } from './specialty-select.component';
import { ColorSelectComponent, ColorSelectOption } from './color-select.component';

@Component({
  selector: 'lc-book-appointment-modal',
  standalone: true,
  imports: [FormsModule, SpecialtySelectComponent, ColorSelectComponent],
  templateUrl: './book-appointment-modal.component.html',
  styleUrl: './book-appointment-modal.component.scss',
})
export class BookAppointmentModalComponent {
  @Output() close = new EventEmitter<void>();

  private readonly service = inject(AppointmentsService);

  readonly todayISO = new Date().toISOString().split('T')[0];

  readonly typeOptions: ColorSelectOption[] = [
    { value: 'Consultation',      accent: '#059669' },
    { value: 'Follow-up',         accent: '#2563EB' },
    { value: 'Lab Test',          accent: '#D97706' },
    { value: 'Physiotherapy',     accent: '#0D9488' },
    { value: 'Specialist Review', accent: '#7C3AED' },
  ];

  readonly durationOptions: ColorSelectOption[] = [
    { value: '15 min',    accent: '#059669' },
    { value: '30 min',    accent: '#2563EB' },
    { value: '45 min',    accent: '#4F46E5' },
    { value: '1 hour',    accent: '#D97706' },
    { value: '1.5 hours', accent: '#DC2626' },
    { value: '2 hours',   accent: '#991B1B' },
  ];

  form = {
    isoDate: '',
    time24: '',
    provider: '',
    specialty: '',
    facility: '',
    type: 'Consultation' as ApptType,
    duration: '30 min',
    note: '',
  };

  submit(f: NgForm): void {
    if (f.invalid || !this.form.specialty) return;
    this.service.add({
      isoDate: this.form.isoDate,
      time24: this.form.time24,
      duration: this.form.duration,
      provider: this.form.provider.trim(),
      specialty: this.form.specialty,
      facility: this.form.facility.trim(),
      type: this.form.type,
      note: this.form.note.trim() || undefined,
    });
    this.close.emit();
  }

  onOverlayClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) this.close.emit();
  }
}
