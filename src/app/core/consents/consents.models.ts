/** Mirrors the backend ConsentPurpose enum. */
export type ConsentPurpose = 'ngo_funding' | 'clinical_research_recruitment' | 'hmo_care';

/** Mirrors the backend ConsentStatus enum. */
export type ConsentStatus = 'not_granted' | 'pending' | 'active' | 'paused' | 'revoked';

/** A consent grant as GET /consents/me returns it. */
export interface ConsentGrant {
  id: string;
  purpose: ConsentPurpose;
  status: ConsentStatus;
  dataScopes: string[];
  grantedAt?: string;
  revokedAt?: string;
}

/** GET /consents/:id/impact — what revoking would tear down. */
export interface ConsentImpact {
  affectedEnrollments: Array<{ id: string; programId: string; programTitle: string; status: string }>;
  affectedStudyEnrollments: Array<{ id: string; studyId: string; studyTitle: string; status: string }>;
  totalAffected: number;
}

/**
 * Patient-facing copy per purpose. Kept beside the model rather than in the
 * component so the consent screen and any future summary read the same words.
 */
export const CONSENT_PURPOSE_COPY: Record<ConsentPurpose, { title: string; description: string }> = {
  ngo_funding: {
    title: 'NGO funding programmes',
    description:
      'Lets NGO partners see your profile so they can match you to funding programmes you may qualify for.',
  },
  clinical_research_recruitment: {
    title: 'Clinical research',
    description:
      'Lets approved researchers invite you to studies relevant to your conditions. You choose whether to join each one.',
  },
  hmo_care: {
    title: 'HMO care coordination',
    description:
      'Lets your HMO see your care record so they can coordinate treatment and process claims.',
  },
};

/**
 * The canonical scopes per purpose, mirroring SNAPSHOT_FIELDS on the backend.
 *
 * Needed for two reasons: POST /consents validates the submitted scopes against this
 * exact list and rejects an empty array (@ArrayMinSize(1)), and the screen shows the
 * patient what they would share *before* they agree rather than after.
 */
export const CONSENT_DEFAULT_SCOPES: Record<ConsentPurpose, string[]> = {
  ngo_funding: ['name', 'conditionTags', 'address', 'directContactShared'],
  hmo_care: ['name', 'conditionTags', 'address', 'membershipNumber', 'medicationList'],
  clinical_research_recruitment: [
    'name',
    'conditionTags',
    'address',
    'directContactShared',
    'medicationList',
  ],
};

/** Human labels for the scope keys above. */
export const CONSENT_SCOPE_LABELS: Record<string, string> = {
  name: 'Your name',
  conditionTags: 'Your health conditions',
  address: 'Your address',
  directContactShared: 'Whether you allow direct contact',
  membershipNumber: 'Your membership number',
  medicationList: 'Your medication list',
};

/** Which transitions the backend will accept — mirrors VALID_TRANSITIONS. */
export function canGrant(status: ConsentStatus): boolean {
  return status === 'not_granted' || status === 'paused' || status === 'pending';
}

export function canPause(status: ConsentStatus): boolean {
  return status === 'active';
}

export function canRevoke(status: ConsentStatus): boolean {
  return status === 'active' || status === 'paused';
}

export function consentStatusLabel(status: ConsentStatus): string {
  const map: Record<ConsentStatus, string> = {
    not_granted: 'Not shared',
    pending: 'Pending',
    active: 'Sharing',
    paused: 'Paused',
    revoked: 'Revoked',
  };
  return map[status] ?? status;
}
