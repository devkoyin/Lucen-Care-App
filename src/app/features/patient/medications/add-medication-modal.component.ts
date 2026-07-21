import { Component, EventEmitter, Output } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { CreateMedicationPayload } from '../../../core/medications/medications.models';
import { SpecialtySelectComponent } from '../appointments/specialty-select.component';

interface TimeOption {
  label: string;
  icon: string;
  time: string;
  checked: boolean;
}

const FREQUENCY_OPTIONS = [
  'Once daily',
  'Twice daily',
  'Three times daily',
  'Four times daily',
  'Every 8 hours',
  'Every 12 hours',
  'As needed',
  'Weekly',
];

@Component({
  selector: 'lc-add-medication-modal',
  standalone: true,
  imports: [FormsModule, SpecialtySelectComponent],
  templateUrl: './add-medication-modal.component.html',
  styleUrl: './add-medication-modal.component.scss',
})
export class AddMedicationModalComponent {
  @Output() close = new EventEmitter<void>();
  @Output() saved = new EventEmitter<CreateMedicationPayload>();

  readonly todayISO = new Date().toISOString().split('T')[0];
  readonly frequencyOptions = FREQUENCY_OPTIONS;

  readonly timeOptions: TimeOption[] = [
    { label: 'Morning',   icon: '🌅', time: '8:00 AM',  checked: false },
    { label: 'Afternoon', icon: '☀️',  time: '2:00 PM',  checked: false },
    { label: 'Evening',   icon: '🌆', time: '8:00 PM',  checked: false },
    { label: 'Bedtime',   icon: '🌙', time: '10:00 PM', checked: false },
  ];

  form = {
    name: '',
    dosage: '',
    condition: '',
    frequency: 'Once daily',
    prescriber: '',
    specialty: '',
    pillsTotal: 30,
    refillDateISO: '',
    note: '',
  };

  get selectedTimes(): string[] {
    return this.timeOptions.filter(t => t.checked).map(t => t.time);
  }

  get isValid(): boolean {
    return !!(
      this.form.name.trim() &&
      this.form.dosage.trim() &&
      this.form.condition.trim() &&
      this.form.frequency &&
      this.form.prescriber.trim() &&
      this.form.specialty &&
      this.form.pillsTotal > 0 &&
      this.form.refillDateISO &&
      this.selectedTimes.length > 0
    );
  }

  toggleTime(opt: TimeOption): void {
    opt.checked = !opt.checked;
  }

  submit(f: NgForm): void {
    if (f.invalid || !this.isValid) return;

    const payload: CreateMedicationPayload = {
      name: this.form.name.trim(),
      dosage: this.form.dosage.trim(),
      condition: this.form.condition.trim(),
      frequency: this.form.frequency,
      scheduleTimes: this.selectedTimes,
      prescriber: this.form.prescriber.trim(),
      specialty: this.form.specialty,
      pillsTotal: this.form.pillsTotal,
      refillDate: this.form.refillDateISO,
      notes: this.form.note.trim() || undefined,
    };

    this.saved.emit(payload);
    this.close.emit();
  }

  onOverlayClick(e: MouseEvent): void {
    if (e.target === e.currentTarget) this.close.emit();
  }
}
