export type Role = 'patient' | 'ngo' | 'hmo' | 'admin' | 'professional' | 'benefactor';

export interface User {
  id: string;
  role: Role;
  name: string;
  email: string;
  status: 'active' | 'pending';
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface SignupPayload {
  name: string;
  email: string;
  password: string;
  role: Role;
}

export interface PatientOnboardingPayload {
  accountType: string;
  dateOfBirth: string;
  biologicalSex: string;
  country: string;
  conditions: string;
  primaryLanguage: string;
  termsConsent: boolean;
  ngoConsent: boolean;
  researchConsent: boolean;
}
