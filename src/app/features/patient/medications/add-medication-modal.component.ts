import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { CreateMedicationPayload } from '../../../core/medications/medications.models';
import { SpecialtySelectComponent } from '../appointments/specialty-select.component';

const FREQUENCY_OPTIONS = [
  'Once daily',
  'Twice daily',
  'Three times daily',
  'Four times daily',
  'As needed',
  'Weekly',
];

const FREQUENCY_SLOT_COUNT: Record<string, number> = {
  'Once daily':        1,
  'Twice daily':       2,
  'Three times daily': 3,
  'Four times daily':  4,
  'As needed':         1,
  'Weekly':            1,
};

@Component({
  selector: 'lc-add-medication-modal',
  standalone: true,
  imports: [FormsModule, SpecialtySelectComponent],
  templateUrl: './add-medication-modal.component.html',
  styleUrl: './add-medication-modal.component.scss',
})
export class AddMedicationModalComponent implements OnInit {
  @Input() editMed: Medication | null = null;
  @Output() close = new EventEmitter<void>();
  @Output() saved = new EventEmitter<CreateMedicationPayload>();

  readonly todayISO = new Date().toISOString().split('T')[0];
  readonly frequencyOptions = FREQUENCY_OPTIONS;

  doseTimes: string[] = [''];
  weeklyDay = '';

  readonly weekDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

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

  get isEditMode(): boolean { return !!this.editMed; }

  ngOnInit(): void {
    if (this.editMed) this.populateFromEdit(this.editMed);
  }

  get slotCount(): number {
    return FREQUENCY_SLOT_COUNT[this.form.frequency] ?? 1;
  }

  get slotIndices(): number[] {
    return Array.from({ length: this.slotCount }, (_, i) => i);
  }

  get isValid(): boolean {
    const timesValid = this.doseTimes.slice(0, this.slotCount).every(t => !!t);
    const weeklyValid = this.form.frequency !== 'Weekly' || !!this.weeklyDay;
    return !!(
      this.form.name.trim() &&
      this.form.dosage.trim() &&
      this.form.condition.trim() &&
      this.form.frequency &&
      this.form.prescriber.trim() &&
      this.form.specialty &&
      this.form.pillsTotal > 0 &&
      this.form.refillDateISO &&
      timesValid &&
      weeklyValid
    );
  }

  onFrequencyChange(): void {
    this.doseTimes = Array(this.slotCount).fill('');
    this.weeklyDay = '';
  }

  submit(f: NgForm): void {
    if (f.invalid || !this.isValid) return;

    const urgency = this.calcUrgency(this.form.refillDateISO);
    const refillLabel = new Date(this.form.refillDateISO + 'T00:00:00')
      .toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

    const med: Medication = {
      id: this.editMed?.id ?? 'med-' + Date.now(),
      name: this.form.name.trim(),
      dosage: this.form.dosage.trim(),
      condition: this.form.condition.trim(),
      frequency: this.form.frequency,
      schedule: this.form.frequency === 'Weekly'
        ? [`${this.weeklyDay} · ${this.to12h(this.doseTimes[0])}`]
        : this.doseTimes.slice(0, this.slotCount).map(t => this.to12h(t)),
      prescriber: this.form.prescriber.trim(),
      specialty: this.form.specialty,
      pillsRemaining: this.editMed ? this.editMed.pillsRemaining : this.form.pillsTotal,
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

  private populateFromEdit(med: Medication): void {
    this.form.name        = med.name;
    this.form.dosage      = med.dosage;
    this.form.condition   = med.condition;
    this.form.frequency   = med.frequency;
    this.form.prescriber  = med.prescriber;
    this.form.specialty   = med.specialty;
    this.form.pillsTotal  = med.pillsTotal;
    this.form.refillDateISO = med.refillDateISO ?? '';
    this.form.note        = '';

    if (med.frequency === 'Weekly' && med.schedule[0]?.includes(' · ')) {
      const [day, time] = med.schedule[0].split(' · ');
      this.weeklyDay = day;
      this.doseTimes = [this.to24h(time)];
    } else {
      this.doseTimes = med.schedule.map(t => this.to24h(t));
    }
  }

  private to12h(time24: string): string {
    const [h, m] = time24.split(':').map(Number);
    const period = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 || 12;
    return `${h12}:${m.toString().padStart(2, '0')} ${period}`;
  }

  private to24h(time12: string): string {
    const match = time12.match(/^(\d+):(\d+)\s*(AM|PM)$/i);
    if (!match) return '';
    let h = parseInt(match[1], 10);
    const m = match[2];
    const period = match[3].toUpperCase();
    if (period === 'PM' && h !== 12) h += 12;
    if (period === 'AM' && h === 12) h = 0;
    return `${h.toString().padStart(2, '0')}:${m}`;
  }

  private calcUrgency(iso: string): RefillUrgency {
    const days = Math.floor((new Date(iso).getTime() - Date.now()) / 86_400_000);
    return days <= 7 ? 'urgent' : days <= 14 ? 'upcoming' : 'ok';
  }
}
