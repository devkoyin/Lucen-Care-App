import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { ApiService } from '../api/api.service';
import {
  Appointment,
  AppointmentStats,
  CreateAppointmentPayload,
  RescheduleAppointmentPayload,
  UpdateAppointmentPayload,
  codeToType,
  deriveDateFields,
  formatTime,
  typeToCode,
} from './appointments.models';

interface WrappedResponse<T> { data: T; traceId: string; }

interface RawAppointment {
  id: string;
  appointmentDate: string;
  time: string;
  duration: string;
  provider: string;
  specialty: string;
  facility: string;
  type: string;
  status: 'confirmed' | 'pending' | 'completed' | 'cancelled';
  note?: string;
}

@Injectable({ providedIn: 'root' })
export class AppointmentsService {
  private readonly api = inject(ApiService);

  getAppointments(): Observable<Appointment[]> {
    return this.api.get<WrappedResponse<RawAppointment[]>>('/appointments')
      .pipe(map(r => r.data.map(toAppointment)));
  }

  createAppointment(payload: CreateAppointmentPayload): Observable<Appointment> {
    const body = {
      appointmentDate: payload.isoDate,
      time: formatTime(payload.time24),
      duration: payload.duration,
      provider: payload.provider,
      specialty: payload.specialty,
      facility: payload.facility,
      type: typeToCode(payload.type),
      note: payload.note,
    };
    return this.api.post<WrappedResponse<RawAppointment>>('/appointments', body)
      .pipe(map(r => toAppointment(r.data)));
  }

  updateAppointment(id: string, payload: UpdateAppointmentPayload): Observable<Appointment> {
    const body = {
      provider: payload.provider,
      specialty: payload.specialty,
      facility: payload.facility,
      type: payload.type ? typeToCode(payload.type) : undefined,
      note: payload.note,
    };
    return this.api.patch<WrappedResponse<RawAppointment>>(`/appointments/${id}`, body)
      .pipe(map(r => toAppointment(r.data)));
  }

  rescheduleAppointment(id: string, payload: RescheduleAppointmentPayload): Observable<Appointment> {
    const body = {
      appointmentDate: payload.isoDate,
      time: formatTime(payload.time24),
      duration: payload.duration,
      note: payload.note,
    };
    return this.api.patch<WrappedResponse<RawAppointment>>(`/appointments/${id}/reschedule`, body)
      .pipe(map(r => toAppointment(r.data)));
  }

  cancelAppointment(id: string): Observable<Appointment> {
    return this.api.post<WrappedResponse<RawAppointment>>(`/appointments/${id}/cancel`, {})
      .pipe(map(r => toAppointment(r.data)));
  }

  getStats(): Observable<AppointmentStats> {
    return this.api.get<WrappedResponse<AppointmentStats>>('/appointments/stats')
      .pipe(map(r => r.data));
  }
}

function toAppointment(raw: RawAppointment): Appointment {
  return {
    id: raw.id,
    isoDate: raw.appointmentDate,
    ...deriveDateFields(raw.appointmentDate),
    time: raw.time,
    duration: raw.duration,
    provider: raw.provider,
    specialty: raw.specialty,
    facility: raw.facility,
    type: codeToType(raw.type),
    status: raw.status,
    note: raw.note,
  };
}
