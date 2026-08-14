import { Component, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';

/** One row on the settings landing page. */
export interface SettingsModule {
  icon: string;
  label: string;
  description: string;
  /**
   * Absolute — the landing sits at the `''` child of `settings`, so a relative
   * link would have to climb with `../`, which breaks the moment the route moves.
   */
  route: string;
}

/**
 * Role-neutral settings landing, shared by every portal the way the community
 * feature is. The list comes from route data rather than a role check, so a
 * portal opts in by declaring its modules and nothing here needs to know which
 * role is looking.
 */
@Component({
  selector: 'lc-settings',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.scss',
})
export class SettingsComponent {
  readonly modules = (inject(ActivatedRoute).snapshot.data['modules'] ?? []) as SettingsModule[];
}
