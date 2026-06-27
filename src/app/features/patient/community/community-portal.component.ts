import { Component, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { GuidelinesModalComponent } from './guidelines-modal/guidelines-modal.component';

@Component({
  selector: 'lc-community-portal',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, RouterOutlet, GuidelinesModalComponent],
  templateUrl: './community-portal.component.html',
  styleUrl: './community-portal.component.scss',
})
export class CommunityPortalComponent {
  readonly showGuidelines = signal(false);
}
