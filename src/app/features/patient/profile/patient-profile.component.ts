import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { apiErrorMessage } from '../../../core/api/wrapped-response.model';
import { NIGERIA_STATES } from '../../../core/geo/nigeria';
import {
  PatientProfile,
  PatientProfilePatch,
  PatientService,
} from '../../../core/patients/patient.service';
import { FormFieldComponent } from '../../../shared/components/form-field/form-field.component';

/**
 * The patient's own record, editable.
 *
 * It exists chiefly because location arrived after most patients had onboarded: with
 * no edit path they would have been permanently unlocatable, invisible to every
 * state-scoped programme and stuck in the coverage map's Unspecified bucket forever.
 */
@Component({
  selector: 'lc-patient-profile',
  standalone: true,
  imports: [ReactiveFormsModule, FormFieldComponent],
  templateUrl: './patient-profile.component.html',
  styleUrl: './patient-profile.component.scss',
})
export class PatientProfileComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly patients = inject(PatientService);

  readonly states = NIGERIA_STATES;

  readonly loading = signal(true);
  readonly loadError = signal(false);
  readonly saving = signal(false);
  readonly saveError = signal<string | null>(null);
  readonly saved = signal(false);
  readonly profile = signal<PatientProfile | null>(null);

  readonly form = this.fb.group({
    name: ['', [Validators.required, Validators.maxLength(120)]],
    phone: [''],
    dateOfBirth: [''],
    address: [''],
    locationState: [''],
    locationLga: [''],
  });

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.patients.getProfile().subscribe({
      next: (profile) => {
        this.profile.set(profile);
        this.form.patchValue({
          name: profile.name ?? '',
          phone: profile.phone ?? '',
          // The API returns a date-only string; <input type="date"> wants exactly that.
          dateOfBirth: (profile.dateOfBirth ?? '').slice(0, 10),
          address: profile.address ?? '',
          locationState: profile.locationState ?? '',
          locationLga: profile.locationLga ?? '',
        });
        this.loadError.set(false);
        this.loading.set(false);
      },
      error: () => {
        this.loadError.set(true);
        this.loading.set(false);
      },
    });
  }

  save(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid || this.saving()) return;

    this.saving.set(true);
    this.saveError.set(null);
    this.saved.set(false);

    this.patients.updateProfile(this.buildPatch()).subscribe({
      next: (profile) => {
        this.profile.set(profile);
        this.saving.set(false);
        this.saved.set(true);
        this.form.markAsPristine();
      },
      error: (err: unknown) => {
        this.saving.set(false);
        this.saveError.set(apiErrorMessage(err, 'Could not save your details.'));
      },
    });
  }

  /**
   * Only what actually changed. Sending every field would let a blank optional input
   * overwrite a value the patient never touched.
   */
  private buildPatch(): PatientProfilePatch {
    const current = this.profile();
    const value = this.form.getRawValue();
    const patch: PatientProfilePatch = {};

    // Empty is treated as "left alone", not "clear it": an empty dateOfBirth fails
    // @IsISO8601 with a 422, and an empty phone would collide with the unique index
    // the moment a second patient did the same.
    const put = <K extends keyof PatientProfilePatch>(key: K, next: string, before?: string) => {
      const trimmed = next.trim();
      if (trimmed && trimmed !== (before ?? '')) patch[key] = trimmed as PatientProfilePatch[K];
    };

    put('name', value.name ?? '', current?.name);
    put('phone', value.phone ?? '', current?.phone);
    put('dateOfBirth', value.dateOfBirth ?? '', (current?.dateOfBirth ?? '').slice(0, 10));
    put('address', value.address ?? '', current?.address);
    put('locationState', value.locationState ?? '', current?.locationState);
    put('locationLga', value.locationLga ?? '', current?.locationLga);

    return patch;
  }
}
