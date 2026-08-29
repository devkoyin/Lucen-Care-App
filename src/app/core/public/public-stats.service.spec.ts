import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { environment } from '../../../environments/environment';
import { PublicStatsService } from './public-stats.service';

const STATS_URL = `${environment.apiUrl}/public/stats`;

describe('PublicStatsService', () => {
  let service: PublicStatsService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [PublicStatsService, provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(PublicStatsService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('unwraps the standard response envelope', () => {
    let stats: unknown;
    service.getStats().subscribe(s => (stats = s));

    http.expectOne(STATS_URL).flush({
      data: { patients: 12, ngoPrograms: 4 },
      traceId: 'trace-1',
    });

    expect(stats).toEqual({ patients: 12, ngoPrograms: 4 });
  });

  it('surfaces a failure to the caller rather than swallowing it', () => {
    let errored = false;
    service.getStats().subscribe({ error: () => (errored = true) });

    http.expectOne(STATS_URL).flush('nope', { status: 503, statusText: 'Service Unavailable' });

    expect(errored).toBeTrue();
  });
});
