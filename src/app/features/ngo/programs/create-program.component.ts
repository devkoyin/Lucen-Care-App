import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { apiErrorMessage } from '../../../core/api/wrapped-response.model';
import {
  CreateProgramPayload,
  NgoProgram,
  NgoProgramsService,
  UpdateProgramPayload,
  toKobo,
  toNaira,
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
export class CreateProgramComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly svc = inject(NgoProgramsService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly criterionFields = CRITERION_FIELDS;
  readonly operators = OPERATORS;

  readonly submitting = signal(false);
  readonly error = signal<string | null>(null);

  // Edit mode reuses this whole component: one form, one set of validators, one
  // payload mapper. A second near-identical screen would drift within a release.
  readonly programId = signal<string | null>(null);
  readonly loading = signal(false);
  readonly loadError = signal(false);
  /** Approved programmes are frozen apart from the closing date — the API 422s the rest. */
  readonly locked = signal(false);

  readonly isEdit = computed(() => this.programId() !== null);

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

  readonly canSubmit = computed(
    () => this.missing().length === 0 && !this.submitting() && !this.loading(),
  );

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) return;

    this.programId.set(id);
    this.loading.set(true);
    this.svc.getOne(id).subscribe({
      next: (program) => {
        this.prefill(program);
        this.loading.set(false);
      },
      error: () => {
        this.loadError.set(true);
        this.loading.set(false);
      },
    });
  }

  private prefill(program: NgoProgram): void {
    // Only the first criterion is editable here, matching the create form. A
    // programme with several keeps the rest untouched — the payload only carries
    // what this form can express, so nothing is silently dropped.
    const criterion = program.eligibilityCriteria?.[0];
    const value = Array.isArray(criterion?.value)
      ? (criterion.value as unknown[]).join(', ')
      : String(criterion?.value ?? '');

    this.form.patchValue({
      title: program.title,
      focus: program.focus ?? '',
      description: program.description ?? '',
      donor: program.donor ?? '',
      coordinator: program.coordinator ?? '',
      budgetTotal: program.budgetTotal != null ? toNaira(program.budgetTotal) : null,
      slotsTotal: program.slotsTotal ?? null,
      expiresAt: program.expiresAt.slice(0, 10),
      criterionField: criterion?.field ?? 'conditionTags',
      criterionOperator: criterion?.operator ?? 'in',
      criterionValue: value,
    });

    if (program.status === 'approved') {
      this.locked.set(true);
      // Disabled controls drop out of the payload too, so a locked field cannot be
      // sent even by a client that ignores the visual state.
      for (const [name, control] of Object.entries(this.form.controls)) {
        if (name !== 'expiresAt') control.disable({ emitEvent: false });
      }
    }
  }

  submit(): void {
    if (this.submitting() || this.loading()) return;

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

    const id = this.programId();
    const request = id
      ? this.svc.update(id, this.editPayload(payload))
      : this.svc.create(payload);

    request.subscribe({
      next: () => this.router.navigate(['/ngo/programs']),
      error: (err: unknown) => {
        this.submitting.set(false);
        this.error.set(this.messageFor(err));
      },
    });
  }

  /**
   * An approved programme accepts only the closing date; sending the rest would
   * earn a 422 naming every locked field, which is not the NGO's mistake to read.
   */
  private editPayload(payload: CreateProgramPayload): UpdateProgramPayload {
    const { type: _type, ...rest } = payload;
    return this.locked() ? { expiresAt: payload.expiresAt } : rest;
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
