import { Component, inject } from '@angular/core';
import { AuthService } from '../../../core/auth/auth.service';
import { BenefactorApplicationsService, BenefactorApplication } from '../../../core/applications/benefactor-applications.service';

const MOCK_APPLICATION: BenefactorApplication = {
  id: 'mock',
  status: 'approved',
  submittedAt: '2026-03-12T09:24:00.000Z',
  fullName: 'Adunola Fashola',
  email: 'adunola@example.com',
  phone: '+234 803 456 7890',
  reasonForSupport: 'I have watched family members navigate the healthcare system without adequate support and I want to do my part by being present in communities where patients need encouragement, shared resources, and a sense that someone genuinely cares about their journey.',
  docs: [{ label: 'Government-issued ID', submitted: true }],
  reviewedAt: '2026-03-15T14:00:00.000Z',
  reviewedBy: 'Lucen Care Admin',
};

@Component({
  selector: 'lc-benefactor-profile',
  standalone: true,
  templateUrl: './benefactor-profile.component.html',
  styleUrl: './benefactor-profile.component.scss',
})
export class BenefactorProfileComponent {
  private readonly auth = inject(AuthService);
  private readonly apps = inject(BenefactorApplicationsService);

  get application(): BenefactorApplication {
    return this.apps.findByEmail(this.auth.user()?.email ?? '') ?? MOCK_APPLICATION;
  }
}
