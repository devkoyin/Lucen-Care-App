import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { apiErrorMessage } from '../../../core/api/wrapped-response.model';
import {
  CreateProgramPayload,
  NgoProgramsService,
  toKobo,
} from '../../../core/programs/ngo-programs.service';
import { FormFieldComponent } from '../../../shared/components/form-field/form-field.component';

/**
 * The eligibility fields MatchingService actually understands. Anything else is
 * silently ignored server-side, which would make a programme match everyone — so
 * the form offers only fields that really filter.
 */
const CRITERION_FIELDS = [
  { value: 'conditionTags', label: 'Health condition' },
  { value: 'gender', label: 'Gender' },
  { value: 'dateOfBirth', label: 'Date of birth' },
];

const OPERATORS = [
  { value: 'in', label: 'is one of' },
  { value: 'eq', label: 'is' },
  { value: 'gte', label: 'is on or after' },
  { value: 'lte', label: 'is on or before' },
  { value: 'contains', label: 'contains' },
];

/**
 * A user-facing label for EVERY control, not only the three the user types into.
 * `missing()` is derived from the whole form, so a control can never be invalid
 * without being named — the earlier list covered three of the five required
 * controls, which let the button enable while `form.invalid` still refused the
 * submit, giving a button that did nothing and said nothing.
 */
const FIELD_LABELS: Record<string, string> = {
  title: 'Programme name',
  focus: 'Focus',
  description: 'Description',
  donor: 'Donor / Funder',
  coordinator: 'Coordinator',
  budgetTotal: 'Total budget',
  slotsTotal: 'Patient places',
  expiresAt: 'Applications close',
  criterionField: 'Who qualifies — field',
  criterionOperator: 'Who qualifies — condition',
  criterionValue: 'Who qualifies — value',
};

@Component({
  selector: 'lc-create-program',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, FormFieldComponent],
  templateUrl: './create-program.component.html',
  styleUrl: './create-program.component.scss',
})
export class CreateProgramComponent {
  private readonly fb = inject(FormBuilder);
  private readonly svc = inject(NgoProgramsService);
  private readonly router = inject(Router);

  readonly criterionFields = CRITERION_FIELDS;
  readonly operators = OPERATORS;

  readonly submitting = signal(false);
  readonly error = signal<string | null>(null);

  readonly form = this.fb.nonNullable.group({
    title: ['', Validators.required],
    focus: [''],
    description: [''],
    donor: [''],
    coordinator: [''],
    // Naira in the form; converted to kobo on submit.
    budgetTotal: [null as number | null],
    slotsTotal: [null as number | null],
    expiresAt: ['', Validators.required],
    criterionField: ['conditionTags', Validators.required],
    criterionOperator: ['in', Validators.required],
    criterionValue: ['', Validators.required],
  });

  /** The API requires a future expiry, so the picker should not offer today. */
  readonly minExpiry = computed(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  });

  // Re-evaluated on every keystroke so the "still needed" line and the button's
  // disabled state track the form rather than only reacting to a click.
  private readonly formValue = toSignal(this.form.valueChanges, {
    initialValue: this.form.getRawValue(),
  });

  readonly missing = computed<string[]>(() => {
    this.formValue();
    return Object.entries(this.form.controls)
      .filter(([, control]) => control.invalid)
      .map(([name]) => FIELD_LABELS[name] ?? name);
  });

  readonly canSubmit = computed(() => this.missing().length === 0 && !this.submitting());

  submit(): void {
    if (this.submitting()) return;

    // Never refuse in silence: the button is only reachable in this state via
    // Enter or a stale disabled binding, and a click that does nothing at all
    // is indistinguishable from a broken backend call.
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.error.set(`Please complete: ${this.missing().join(', ')}.`);
      return;
    }

    const v = this.form.getRawValue();

    // 'in' takes a list; the others take a single value. Sending a bare string to
    // an 'in' criterion would match nothing.
    const rawValue = v.criterionValue.trim();
    const value =
      v.criterionOperator === 'in'
        ? rawValue.split(',').map(s => s.trim()).filter(Boolean)
        : rawValue;

    const payload: CreateProgramPayload = {
      title: v.title.trim(),
      type: 'ngo_funding',
      eligibilityCriteria: [
        { field: v.criterionField, operator: v.criterionOperator, value },
      ],
      // Date input gives a bare date; the API wants a full ISO datetime.
      expiresAt: new Date(`${v.expiresAt}T23:59:59`).toISOString(),
      ...(v.focus.trim() ? { focus: v.focus.trim() } : {}),
      ...(v.description.trim() ? { description: v.description.trim() } : {}),
      ...(v.donor.trim() ? { donor: v.donor.trim() } : {}),
      ...(v.coordinator.trim() ? { coordinator: v.coordinator.trim() } : {}),
      ...(v.budgetTotal != null ? { budgetTotal: toKobo(v.budgetTotal) } : {}),
      ...(v.slotsTotal != null ? { slotsTotal: v.slotsTotal } : {}),
    };

    this.submitting.set(true);
    this.error.set(null);

    this.svc.create(payload).subscribe({
      next: () => this.router.navigate(['/ngo/programs']),
      error: (err: unknown) => {
        this.submitting.set(false);
        this.error.set(this.messageFor(err));
      },
    });
  }

  /**
   * "Organization must be active" is the one refusal an NGO admin will actually hit,
   * and the raw wording reads like a bug rather than "you are still being verified".
   */
  private messageFor(err: unknown): string {
    const status = (err as { status?: number } | undefined)?.status;
    const message = apiErrorMessage(err, 'Could not create this programme. Please try again.');

    if (status === 403 && message.toLowerCase().includes('active')) {
      return 'Your organisation is still awaiting verification, so it cannot publish programmes yet. You will be emailed once the LucenCare team approves it.';
    }
    return message;
  }
}
