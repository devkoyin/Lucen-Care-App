/**
 * Display labels for audit rows, shared by the admin dashboard's Recent Activity
 * panel and the full Audit Log page.
 *
 * The backend AuditAction enum has nine values. The frontend previously mapped only
 * three and defaulted the rest to 'submitted', so a data export, a consent
 * revocation and a cross-org access attempt all rendered as "Submitted" — actively
 * misleading in an audit trail. Every action is mapped here instead.
 */

/** Mirrors the backend AuditAction enum in src/common/enums/index.ts. */
export type AuditAction =
  | 'submitted'
  | 'approved'
  | 'rejected'
  | 'exported'
  | 'consent_revoked'
  | 'consent_changed'
  | 'login'
  | 'cross_org_attempt'
  | 'refill_requested'
  | 'program_updated';

/** Drives the existing badge CSS classes, which only understand these four. */
export type AuditTone = 'pending' | 'approved' | 'rejected' | 'neutral';

/** Backend `action` string → frontend action. Keys are the enum's wire values. */
export const AUDIT_ACTION_MAP: Record<string, AuditAction> = {
  application_submitted: 'submitted',
  admin_approve: 'approved',
  admin_reject: 'rejected',
  export: 'exported',
  revoke_consent: 'consent_revoked',
  consent_change: 'consent_changed',
  login: 'login',
  cross_org_attempt: 'cross_org_attempt',
  medication_refill_requested: 'refill_requested',
  program_updated: 'program_updated',
};

export const AUDIT_ACTION_LABEL: Record<AuditAction, string> = {
  submitted: 'Submitted',
  approved: 'Approved',
  rejected: 'Rejected',
  exported: 'Data exported',
  consent_revoked: 'Consent revoked',
  consent_changed: 'Consent changed',
  login: 'Signed in',
  cross_org_attempt: 'Cross-org attempt',
  refill_requested: 'Refill requested',
  program_updated: 'Programme edited',
};

const AUDIT_ACTION_TONE: Record<AuditAction, AuditTone> = {
  submitted: 'pending',
  approved: 'approved',
  rejected: 'rejected',
  // A revocation or a blocked cross-org attempt is not a failed approval, but it is
  // the class of event an admin should notice, so it borrows the rejected styling.
  consent_revoked: 'rejected',
  cross_org_attempt: 'rejected',
  exported: 'neutral',
  consent_changed: 'neutral',
  login: 'neutral',
  refill_requested: 'neutral',
  program_updated: 'neutral',
};

/** What an audit row is about. Organisations resolve to ngo/hmo via resourceSubtype. */
export type AuditSubjectType =
  | 'ngo'
  | 'hmo'
  | 'professional'
  | 'benefactor'
  | 'program'
  | 'study'
  | 'user'
  | 'patient'
  | 'medication'
  | 'consent';

/** Backend `resourceType` → subject. `organization` is resolved by subtype first. */
export const AUDIT_SUBJECT_MAP: Record<string, AuditSubjectType> = {
  organization: 'ngo',
  professional_application: 'professional',
  benefactor_application: 'benefactor',
  program: 'program',
  study: 'study',
  User: 'user',
  patient: 'patient',
  medication: 'medication',
  ConsentGrant: 'consent',
};

const AUDIT_SUBJECT_LABEL: Record<AuditSubjectType, string> = {
  ngo: 'NGO',
  hmo: 'HMO',
  professional: 'Professional',
  benefactor: 'Benefactor',
  program: 'Program',
  study: 'Study',
  user: 'User',
  patient: 'Patient',
  medication: 'Medication',
  consent: 'Consent',
};

export function auditActionLabel(action: AuditAction): string {
  return AUDIT_ACTION_LABEL[action] ?? action;
}

export function auditActionTone(action: AuditAction): AuditTone {
  return AUDIT_ACTION_TONE[action] ?? 'neutral';
}

export function auditSubjectLabel(subject: AuditSubjectType): string {
  return AUDIT_SUBJECT_LABEL[subject] ?? subject;
}

export function auditDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function auditTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}

export function auditTimeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return auditDate(iso);
}
