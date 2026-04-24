import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { HttpParams } from '@angular/common/http';
import { ApiService } from './api.service';
import { environment } from '../../../environments/environment';

describe('ApiService', () => {
  let service: ApiService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ApiService],
    });
    service = TestBed.inject(ApiService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('creates', () => expect(service).toBeTruthy());

  it('GET requests the correct URL', () => {
    service.get('/test').subscribe();
    const req = http.expectOne(`${environment.apiUrl}/test`);
    expect(req.request.method).toBe('GET');
    req.flush({});
  });

  it('POST sends body to the correct URL', () => {
    service.post('/submit', { name: 'test' }).subscribe();
    const req = http.expectOne(`${environment.apiUrl}/submit`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ name: 'test' });
    req.flush({});
  });

  it('GET passes query params', () => {
    const params = new HttpParams().set('page', '1');
    service.get('/items', params).subscribe();
    const req = http.expectOne(`${environment.apiUrl}/items?page=1`);
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });

  it('PATCH sends body to the correct URL', () => {
    service.patch('/items/1', { active: false }).subscribe();
    const req = http.expectOne(`${environment.apiUrl}/items/1`);
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual({ active: false });
    req.flush({});
  });

  it('DELETE requests the correct URL', () => {
    service.delete('/items/1').subscribe();
    const req = http.expectOne(`${environment.apiUrl}/items/1`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });
});
