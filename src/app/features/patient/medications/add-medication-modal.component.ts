import { Component, EventEmitter, Input, OnInit, Output, inject, signal } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { apiErrorMessage } from '../../../core/api/wrapped-response.model';
import {
  CreateMedicationPayload,
  Medication,
} from '../../../core/medications/medications.models';
import { MedicationsService } from '../../../core/medications/medications.service';
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
  private readonly service = inject(MedicationsService);

  @Input() editMed: Medication | null = null;
  @Output() close = new EventEmitter<void>();
  /** Emitted after the API confirms the write, so the parent only refreshes on success. */
  @Output() saved = new EventEmitter<Medication>();

  readonly submitting = signal(false);
  readonly error = signal<string | null>(null);

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
    // Iterate the slots the template actually renders. `slice(0, slotCount)`
    // TRUNCATES rather than pads, so a short doseTimes array made every() pass
    // vacuously — enabling Save while Angular's own `required` validators failed,
    // which left submit() returning early on a button that looked clickable.
    const timesValid = this.slotIndices.every(i => !!this.doseTimes[i]);
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

  /**
   * Takes the new frequency from the event rather than re-reading form.frequency,
   * so resizing never depends on the [(ngModel)] write-back having run first.
   */
  /** Named so a disabled Save button is explainable rather than mysterious. */
  get missingFieldsMessage(): string {
    const missing: string[] = [];
    if (!this.form.name.trim()) missing.push('medication name');
    if (!this.form.dosage.trim()) missing.push('dosage');
    if (!this.form.condition.trim()) missing.push('condition');
    if (!this.form.prescriber.trim()) missing.push('prescriber');
    if (!this.form.specialty) missing.push('specialty');
    if (!(this.form.pillsTotal > 0)) missing.push('pill count');
    if (!this.form.refillDateISO) missing.push('refill date');
    if (this.form.frequency === 'Weekly' && !this.weeklyDay) missing.push('day of week');
    if (!this.slotIndices.every(i => !!this.doseTimes[i])) missing.push('every dose time');

    return missing.length
      ? `Please provide ${missing.join(', ')}.`
      : 'Please complete the required fields.';
  }

  onFrequencyChange(next: string): void {
    this.doseTimes = Array(FREQUENCY_SLOT_COUNT[next] ?? 1).fill('');
    this.weeklyDay = '';
  }

  submit(f: NgForm): void {
    if (f.invalid || !this.isValid || this.submitting()) return;

    const payload: CreateMedicationPayload = {
      name: this.form.name.trim(),
      dosage: this.form.dosage.trim(),
      condition: this.form.condition.trim(),
      frequency: this.form.frequency,
      scheduleTimes: this.form.frequency === 'Weekly'
        ? [`${this.weeklyDay} · ${this.to12h(this.doseTimes[0])}`]
        : this.slotIndices.map(i => this.to12h(this.doseTimes[i])),
      prescriber: this.form.prescriber.trim(),
      specialty: this.form.specialty,
      pillsTotal: this.form.pillsTotal,
      refillDate: this.form.refillDateISO,
      notes: this.form.note.trim() || '',
    };

    const editing = this.editMed;
    // The modal owns the request so it can stay open and keep the user's input when
    // the API rejects it. Previously it emitted `close` synchronously before the
    // POST resolved, so any failure silently discarded the whole form.
    const request$ = editing
      ? this.service.updateMedication(editing.id, {
          ...payload,
          // Without this, lowering pillsTotal leaves the old larger pillsRemaining
          // behind and the refill bar renders past 100%.
          pillsRemaining: Math.min(editing.pillsRemaining, payload.pillsTotal),
        })
      : this.service.createMedication(payload);

    this.submitting.set(true);
    this.error.set(null);

    request$.subscribe({
      next: saved => {
        this.saved.emit(saved);
        this.close.emit();
      },
      error: (err: unknown) => {
        this.submitting.set(false);
        this.error.set(
          apiErrorMessage(err, 'Could not save this medication. Please try again.'),
        );
      },
    });
  }

  onOverlayClick(e: MouseEvent): void {
    // Don't let a stray backdrop click throw away a form mid-submit.
    if (e.target === e.currentTarget && !this.submitting()) this.close.emit();
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
    // Was hardcoded empty, so editing always showed a blank Note and an existing
    // note could be neither read nor cleared.
    this.form.note        = med.notes ?? '';

    if (med.frequency === 'Weekly' && med.schedule[0]?.includes(' · ')) {
      const [day, time] = med.schedule[0].split(' · ');
      this.weeklyDay = day;
      this.doseTimes = [this.to24h(time)];
    } else {
      this.doseTimes = med.schedule.map(t => this.to24h(t));
    }
  }

  private to12h(time24: string): string {
    // Guarded: on an empty or malformed value this used to throw on m.toString(),
    // taking the whole submit down.
    const [h, m] = (time24 ?? '').split(':').map(Number);
    if (!Number.isFinite(h) || !Number.isFinite(m)) return '';

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
}
