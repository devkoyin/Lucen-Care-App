import { HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { ApiService } from '../api/api.service';
import {
  CreateMedicationPayload,
  DoseStatus,
  Medication,
  MedicationStats,
  RefillAlert,
  RefillUrgency,
  ScheduleSlot,
  calcRefillUrgency,
  formatRefillDate,
  slotMeta,
} from './medications.models';

interface WrappedResponse<T> {
  data: T;
  traceId: string;
}

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

  updateMedication(id: string, payload: Partial<CreateMedicationPayload>): Observable<Medication> {
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

  logDose(medicationId: string, scheduledTime: string, status: DoseStatus, doseDate?: string): Observable<void> {
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
    return this.api.get<WrappedResponse<MedicationStats>>('/medications/stats').pipe(map(r => r.data));
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
