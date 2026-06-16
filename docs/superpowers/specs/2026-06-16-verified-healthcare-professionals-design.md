# Verified Healthcare Professionals — Design Spec

**Date:** 2026-06-16
**Status:** Approved, ready for implementation planning

## Problem

NGOs in Lucen Care provide structured funding programs to patients, but there's no
path for independent, well-meaning healthcare professionals to volunteer direct help
in patient communities. The app needs a new, properly verified user type for this —
distinct from NGOs (no funding/program management) and distinct from patients (carries
a visible mark of verified expertise).

## Goals

- Add a new `professional` role that anyone with medical credentials can sign up for
  (not a hardcoded set of users — a general, repeatable role).
- Require admin verification (credentials + license) before a professional can
  participate in communities, mirroring the existing NGO/HMO approval pattern.
- Let verified professionals join any existing community and post with a visible
  "Verified Health Professional" badge, so patients can tell who they're hearing from.
- Keep the professional's own portal minimal — just Community access and their profile.

## Non-goals

- No restricted/special community subset that only professionals can access —
  professionals use the same communities patients do.
- No professional-led community type, moderation tools, flagging, or reporting system.
- No dashboard, program, or funding management for professionals (that stays NGO-only).
- No re-verification/credential-expiry flow — out of scope for this iteration.

## Design

### 1. Role & data model

Extend `Role` in `src/app/core/auth/auth.models.ts`:

```typescript
export type Role = 'patient' | 'ngo' | 'hmo' | 'admin' | 'professional';
```

New application model, in a new `ProfessionalApplicationsService`
(`src/app/core/applications/` or a sibling location near the existing
`applications.service.ts` — kept as its own service rather than folded into
`OrgApplication` since the entity and lifecycle, while similar, aren't the same):

```typescript
export interface ProfessionalApplication {
  id: string;
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: string;

  fullName: string;
  email: string;
  phone: string;
  profession: 'Doctor' | 'Nurse' | 'Therapist' | 'Other';
  licenseNumber: string;
  specialty: string;
  yearsOfExperience: number;
  bio: string;            // shown on their community badge hover

  docs: AppDoc[];          // reuse existing AppDoc type (license/ID upload)
  rejectionReason?: string;
  reviewedAt?: string;
  reviewedBy?: string;
}
```

### 2. Verification flow

- **Signup**: add a "Healthcare Professional" option to the existing role-select
  screen (alongside Patient/NGO/HMO).
- **Onboarding steps** (mirrors NGO/HMO onboarding shape): Professional Info →
  Credentials & License Upload → Terms/Consent → Verification (pending) screen.
- **Pending state**: account `status: 'pending'`; user sees a holding screen
  (reuse the existing pending-state pattern); no community access until approved.
- **Admin review**: add a **"Professionals"** tab to the admin approvals area,
  reusing the list/detail/approve/reject UI pattern from
  `src/app/features/admin/hmo-approvals`. Admin sees license number, specialty,
  years of experience, and uploaded ID/license document; approves or rejects
  with a reason.
- **Audit trail**: extend the existing `AuditEntry` mechanism so `'professional'`
  submit/approve/reject actions are logged the same way NGO/HMO actions are.
- **On approval**: status → `approved`; user is routed into the professional
  portal (Communities + Profile).
- **On rejection**: user sees the rejection reason, same as the NGO/HMO rejected flow.

### 3. Community integration (the badge)

- Approved professionals can join **any** existing community — no gated subset.
- `CommunityPost` (and any member/author display) gains an optional field:
  `authorBadge?: 'verified-professional'`, set whenever the post author's role
  is `professional` and application status is `approved`.
- Visually: a badge/pill next to the author's name in the feed —
  **"✓ Verified Health Professional"** — showing `specialty` on hover/click
  (e.g. "Dr. Tunde A. · Cardiology"), styled via the existing shared `badge`
  component (`src/app/shared/components`) so it's visually distinct from peer
  posts and from NGO-branded content.
- No moderation tooling, flagging, or reporting — not in scope.

### 4. Professional portal & navigation

- New route group `src/app/features/professional/`:
  - `community/` — reuses the existing community feed/components (same
    communities patients use); professional's own posts carry the badge.
  - `profile/` — view/edit credentials (name, specialty, bio); license number
    and license document become read-only once approved.
- Sidebar (existing authenticated shell) shows only **Community** and
  **My Profile** for this role — no Dashboard/Programs/Funding/etc.
- Extend the existing role-based route guards to recognize `professional`,
  same mechanism already used for `ngo`/`hmo`/`patient`.

## Open questions / risks

None outstanding — all decisions confirmed during brainstorming. Future
iterations may want credential re-verification/expiry and moderation tooling,
but both are explicitly deferred.
