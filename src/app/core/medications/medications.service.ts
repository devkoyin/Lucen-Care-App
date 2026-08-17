import { HttpParams } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';

import { ApiService } from '../api/api.service';
import {
  CreateMedicationPayload,
  DoseStatus,
  LoggableDoseStatus,
  Medication,
  MedicationStats,
  RefillAlert,
  RefillUrgency,
  ScheduleSlot,
  UpdateMedicationPayload,
  calcRefillUrgency,
  formatRefillDate,
  slotMeta,
} from './medications.models';
import { WrappedResponse } from '../api/wrapped-response.model';

interface RawMedication {
  id: string;
  name: string;
  dosage: string;
  condition: string;
  frequency: string;
  scheduleTimes: string[];
  prescriber: string;
  specialty: string;
  pillsRemaining: number;
  pillsTotal: number;
  refillDate: string;
  notes?: string;
}

interface RawScheduleResponse {
  date: string;
  slots: {
    time: string;
    doses: { doseLogId: string; medicationId: string; medName: string; dosage: string; note?: string; status: DoseStatus }[];
  }[];
}

interface RawRefillAlertsResponse {
  alerts: { medicationId: string; name: string; pillsLeft: number; refillDateISO: string; urgency: RefillUrgency }[];
  okCount: number;
}

@Injectable({ providedIn: 'root' })
export class MedicationsService {
  private readonly api = inject(ApiService);
  private readonly _stats = signal<MedicationStats | null>(null);
  private readonly _changed = signal(0);

  getMedications(): Observable<Medication[]> {
    return this.api
      .get<WrappedResponse<RawMedication[]>>('/medications')
      .pipe(map(r => r.data.map(toMedication)));
  }

  createMedication(payload: CreateMedicationPayload): Observable<Medication> {
    return this.api
      .post<WrappedResponse<RawMedication>>('/medications', payload)
      .pipe(map(r => toMedication(r.data)));
  }

  updateMedication(id: string, payload: UpdateMedicationPayload): Observable<Medication> {
    return this.api
      .patch<WrappedResponse<RawMedication>>(`/medications/${id}`, payload)
      .pipe(map(r => toMedication(r.data)));
  }

  deleteMedication(id: string): Observable<void> {
    return this.api.delete<WrappedResponse<{ id: string; deletedAt: string }>>(`/medications/${id}`).pipe(map(() => undefined));
  }

  getSchedule(date?: string): Observable<ScheduleSlot[]> {
    let params = new HttpParams();
    if (date) params = params.set('date', date);

    return this.api.get<WrappedResponse<RawScheduleResponse>>('/medications/schedule', params).pipe(
      map(r =>
        r.data.slots.map(slot => ({
          time: slot.time,
          ...slotMeta(slot.time),
          doses: slot.doses,
        })),
      ),
    );
  }

  // Narrowed to the statuses the API accepts: 'due_now' is a read-time display
  // overlay and the backend's @IsIn rejects it with a 422.
  logDose(
    medicationId: string,
    scheduledTime: string,
    status: LoggableDoseStatus,
    doseDate?: string,
  ): Observable<void> {
    return this.api
      .post(`/medications/${medicationId}/doses/log`, { scheduledTime, status, doseDate })
      .pipe(map(() => undefined));
  }

  getRefillAlerts(): Observable<{ alerts: RefillAlert[]; okCount: number }> {
    return this.api.get<WrappedResponse<RawRefillAlertsResponse>>('/medications/refills').pipe(
      map(r => ({
        okCount: r.data.okCount,
        alerts: r.data.alerts.map(a => ({
          medicationId: a.medicationId,
          name: a.name,
          pillsLeft: a.pillsLeft,
          refillDateISO: a.refillDateISO,
          refillDate: formatRefillDate(a.refillDateISO),
          urgency: a.urgency,
        })),
      })),
    );
  }

  requestRefill(medicationId: string): Observable<void> {
    return this.api.post(`/medications/${medicationId}/request-refill`, {}).pipe(map(() => undefined));
  }

  getStats(): Observable<MedicationStats> {
    return this.api
      .get<WrappedResponse<MedicationStats>>('/medications/stats')
      .pipe(map(r => r.data), tap(stats => this._stats.set(stats)));
  }

  /**
   * Shared so the routed shell's stat tiles and its child routes read one source.
   * Without this, adding a medication left "Active Meds" showing its pre-add value
   * until a full page reload — the shell and the child had no channel between them.
   */
  readonly stats = this._stats.asReadonly();

  /** Call after any successful mutation. Failures leave the last known stats up. */
  refreshStats(): void {
    this.getStats().pipe(catchError(() => of(null))).subscribe();
  }

  /**
   * Bumped whenever the medication list itself changes. The Add button lives on the
   * routed shell but the list lives in a child route, so without this a medication
   * added from the shell would not appear until the tab was left and re-entered.
   * A counter rather than a boolean: two adds in a row must both be observable.
   */
  readonly changed = this._changed.asReadonly();

  notifyChanged(): void {
    this._changed.update(n => n + 1);
  }

  registerReminders(timezone: string): Observable<void> {
    return this.api.post('/medications/reminders/register', { timezone }).pipe(map(() => undefined));
  }

  unregisterReminders(): Observable<void> {
    return this.api.delete('/medications/reminders/unregister').pipe(map(() => undefined));
  }
}

function toMedication(raw: RawMedication): Medication {
  return {
    id: raw.id,
    name: raw.name,
    dosage: raw.dosage,
    condition: raw.condition,
    frequency: raw.frequency,
    schedule: raw.scheduleTimes,
    prescriber: raw.prescriber,
    specialty: raw.specialty,
    pillsRemaining: raw.pillsRemaining,
    pillsTotal: raw.pillsTotal,
    refillDateISO: raw.refillDate,
    refillDate: formatRefillDate(raw.refillDate),
    refillUrgency: calcRefillUrgency(raw.refillDate),
    notes: raw.notes,
  };
}
