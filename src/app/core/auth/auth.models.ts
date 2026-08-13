export type Role = 'patient' | 'ngo' | 'hmo' | 'admin' | 'professional' | 'benefactor';

/** Mirrors the backend `users.status` column. */
export type UserStatus = 'active' | 'pending' | 'suspended';

export interface User {
  id: string;
  role: Role;
  name: string;
  email: string;
  status: UserStatus;
}

/**
 * The wire body also carries `role` — AuthService.login attaches it from the
 * portal the user signed in from. The API treats it as part of the credential.
 */
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
  /**
   * Collected only where the state list means something (Nigeria today). Omitted
   * rather than sent empty — the API treats absent as "not recorded", and the
   * coverage map counts those patients in its Unspecified bucket.
   */
  locationState?: string;
  conditions: string;
  primaryLanguage: string;
  termsConsent: boolean;
  ngoConsent: boolean;
  researchConsent: boolean;
}

// --- Onboarding payloads ---
// These must match the backend DTOs exactly. The API runs a global
// ValidationPipe with `forbidNonWhitelisted: true`, so any extra key is a 422.

export interface NgoOnboardingPayload {
  orgName: string;
  registrationNumber: string;
  tin: string;
  scumlNumber: string;
  focusAreas: string;
  /** Omit entirely when blank — the backend validates it with @IsUrl(). */
  website?: string;
  operatingRegions: string;
  headOfficeCountry: string;
  programDescription: string;
  termsConsent: boolean;
  dataProcessingConsent: boolean;
}

export interface HmoOnboardingPayload {
  orgName: string;
  licenceNumber: string;
  contactPhone: string;
  coverageRegion: string;
  enrolledPatientCount: string;
  specialtyFocus?: string;
  baaAcknowledgement: boolean;
  termsConsent: boolean;
}

export type Profession = 'Doctor' | 'Nurse' | 'Therapist' | 'Other';

export interface ProfessionalOnboardingPayload {
  profession: Profession;
  licenseNumber: string;
  specialty: string;
  yearsOfExperience: number;
  phone: string;
  bio: string;
  termsConsent: boolean;
  codeOfConductConsent: boolean;
}

export interface BenefactorOnboardingPayload {
  fullName: string;
  phone: string;
  reasonForSupport: string;
  idConsent: boolean;
  termsConsent: boolean;
  codeOfConductConsent: boolean;
}

// --- GET /auth/me ---

export type ApplicationStatus = 'pending' | 'approved' | 'rejected';

/** Fields common to both application types, plus the role-specific extras. */
export interface MeApplication {
  id: string;
  status: ApplicationStatus;
  submittedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  rejectionReason?: string;

  // professional
  profession?: Profession;
  licenseNumber?: string;
  specialty?: string;
  yearsOfExperience?: number;
  bio?: string;

  // benefactor
  fullName?: string;
  reasonForSupport?: string;
  idConsentGiven?: boolean;

  phone?: string;
}

export interface MeOrganization {
  id: string;
  name: string;
  type: 'ngo' | 'hmo';
  status: 'pending_verification' | 'active' | 'suspended' | 'rejected';
  verifiedAt?: string;
  rejectionReason?: string;
}

/**
 * Live account state. Access tokens are stateless and carry no status claim, so
 * this is the only way a client learns it has been approved without re-logging in.
 */
export interface MeResponse {
  id: string;
  name?: string;
  email: string;
  role: Role;
  status: UserStatus;
  orgId?: string;
  application?: MeApplication;
  organization?: MeOrganization;
}
