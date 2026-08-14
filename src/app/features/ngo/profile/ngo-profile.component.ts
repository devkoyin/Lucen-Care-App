import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { of } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { AuthService } from '../../../core/auth/auth.service';
import { MeOrganization } from '../../../core/auth/auth.models';
import { AppDoc } from '../../../core/applications/applications.service';
import { ReasonNoteComponent } from '../../../shared/components/reason-note/reason-note.component';
import { BackLinkComponent } from '../../../shared/components/back-link/back-link.component';

@Component({
  selector: 'lc-ngo-profile',
  standalone: true,
  imports: [ReasonNoteComponent, BackLinkComponent],
  templateUrl: './ngo-profile.component.html',
  styleUrl: './ngo-profile.component.scss',
})
export class NgoProfileComponent {
  private readonly auth = inject(AuthService);

  private readonly me = toSignal(this.auth.me().pipe(catchError(() => of(null))), {
    initialValue: null,
  });

  /**
   * No extra request: /auth/me already embeds the whole organisation row for NGO
   * staff. Null until it resolves; the template renders a placeholder meanwhile.
   */
  readonly org = computed<MeOrganization | null>(() => this.me()?.organization ?? null);

  /**
   * The same six items an admin reviews on the NGO approvals screen, so what the
   * organisation sees here matches what it was judged on.
   */
  readonly docs = computed<AppDoc[]>(() => {
    const org = this.org();
    if (!org) return [];
    return [
      { label: 'Registration Number',   submitted: !!org.registrationNumber },
      { label: 'TIN',                   submitted: !!org.tin },
      { label: 'SCUML Certificate No.', submitted: !!org.scumlNumber },
      { label: 'Focus Areas',           submitted: !!org.focusAreas },
      { label: 'Operating Regions',     submitted: !!org.operatingRegions },
      { label: 'Program Description',   submitted: !!org.programDescription },
    ];
  });

  readonly statusLabel = computed(() => {
    switch (this.org()?.status) {
      case 'active':    return '✓ Verified NGO';
      case 'suspended': return 'Suspended';
      case 'rejected':  return 'Rejected';
      default:          return 'Pending verification';
    }
  });

  /** An em dash reads as "not recorded"; an empty cell reads as a broken page. */
  value(field: string | undefined): string {
    return field?.trim() ? field : '—';
  }
}
