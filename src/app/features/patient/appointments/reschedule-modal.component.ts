import { Component, EventEmitter, Input, OnInit, Output, inject } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { Appointment, AppointmentsService } from './appointments.service';
import { ColorSelectComponent, ColorSelectOption } from './color-select.component';

function timeToInput(displayTime: string): string {
  const [time, ampm] = displayTime.split(' ');
  const [h, m] = time.split(':').map(Number);
  let hour = h;
  if (ampm === 'PM' && h !== 12) hour += 12;
  if (ampm === 'AM' && h === 12) hour = 0;
  return `${hour.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}

@Component({
  selector: 'lc-reschedule-modal',
  standalone: true,
  imports: [FormsModule, ColorSelectComponent],
  templateUrl: './reschedule-modal.component.html',
  styleUrl: './reschedule-modal.component.scss',
})
export class RescheduleModalComponent implements OnInit {
  @Input({ required: true }) appointment!: Appointment;
  @Output() close = new EventEmitter<void>();

  private readonly service = inject(AppointmentsService);

  readonly todayISO = new Date().toISOString().split('T')[0];

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
    duration: '30 min',
    note: '',
  };

  ngOnInit(): void {
    this.form = {
      isoDate: this.appointment.isoDate,
      time24: timeToInput(this.appointment.time),
      duration: this.appointment.duration,
      note: this.appointment.note ?? '',
    };
  }

  typeIcon(type: string): string {
    return ({
      'Consultation':      '🩺',
      'Follow-up':         '🔄',
      'Lab Test':          '🧪',
      'Physiotherapy':     '🏃',
      'Specialist Review': '👨‍⚕️',
    } as Record<string, string>)[type] ?? '📋';
  }

  submit(f: NgForm): void {
    if (f.invalid) return;
    this.service.reschedule(this.appointment.id, {
      isoDate: this.form.isoDate,
      time24: this.form.time24,
      duration: this.form.duration,
      note: this.form.note.trim() || undefined,
    });
    this.close.emit();
  }

  onOverlayClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) this.close.emit();
  }
}
