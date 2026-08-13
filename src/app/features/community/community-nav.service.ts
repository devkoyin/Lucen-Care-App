import { Injectable, signal } from '@angular/core';

/**
 * The community lives under three different route prefixes — /patient/community,
 * /professional/community and /benefactor/community — all serving the same
 * components. Every in-feature link goes through here so no template has to know
 * which portal it is currently inside.
 *
 * Without this, the hardcoded `/patient/community/...` links would navigate a
 * professional out of their own portal and straight into roleGuard('patient'),
 * which bounces them to the patient login.
 *
 * The base comes from route `data` rather than from AuthService, because it is
 * explicit configuration at the one place each role is already declared and does not
 * depend on cached auth state. CommunityPortalComponent sets it once; Angular's
 * default paramsInheritanceStrategy ('emptyOnly') means children would not inherit
 * `data` through a path-ful parent, so sharing it via a service is what works.
 */
@Injectable({ providedIn: 'root' })
export class CommunityNavService {
  private readonly _base = signal('/patient/community');

  readonly base = this._base.asReadonly();

  setBase(base: string | undefined): void {
    if (base) this._base.set(base);
  }

  /** Usage: [routerLink]="nav.link('group', group.id)" */
  link(...segments: Array<string | number>): Array<string | number> {
    return [this._base(), ...segments];
  }
}
