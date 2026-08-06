import { HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiService } from '../api/api.service';
import { WrappedResponse } from '../api/wrapped-response.model';

export interface PatientProfile {
  id: string;
  userId: string;
  name: string;
  phone?: string;
  membershipNumber?: string;
  dateOfBirth?: string;
  gender?: string;
  address?: string;
  conditionTags: string[];
  medicationList?: MedicationEntry[];
  directContactShared: boolean;
  country?: string;
  primaryLanguage?: string;
  isCaregiver: boolean;
}

export interface MedicationEntry {
  name: string;
  dosage: string;
  frequency: string;
}

export interface PatientEnrollment {
  id: string;
  programId: string;
  programTitle: string;
  programType: string;
  programExpiresAt: string;
  status: string;
  createdAt: string;
}

interface EnrollmentListData {
  enrollments: PatientEnrollment[];
  nextCursor?: string;
}

@Injectable({ providedIn: 'root' })
export class PatientService {
  private readonly api = inject(ApiService);

  getProfile(): Observable<PatientProfile> {
    return this.api
      .get<WrappedResponse<PatientProfile>>('/patients/me')
      .pipe(map(r => r.data));
  }

  getEnrollments(cursor?: string): Observable<EnrollmentListData> {
    let params = new HttpParams();
    if (cursor) params = params.set('cursor', cursor);
    return this.api
      .get<WrappedResponse<EnrollmentListData>>('/enrollments', params)
      .pipe(map(r => r.data));
  }
}
