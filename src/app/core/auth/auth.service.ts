import { Injectable, inject, signal } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { LoginPayload, PatientOnboardingPayload, Role, SignupPayload, User } from './auth.models';
import { ApiService } from '../api/api.service';

interface AuthApiResponse {
  accessToken: string;
  user: User;
}

interface WrappedResponse<T> {
  data: T;
  traceId: string;
}

const ADMIN_EMAIL    = 'admin@lucencare.com';
const ADMIN_PASSWORD = 'Admin@1234';
const USER_KEY       = 'lc_auth_user';
const TOKEN_KEY      = 'lc_auth_token';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly api = inject(ApiService);

  private readonly _user         = signal<User | null>(this.rehydrateUser());
  private readonly _accessToken  = signal<string | null>(this.rehydrateToken());

  readonly user = this._user.asReadonly();

  isAuthenticated(): boolean {
    return this._user() !== null;
  }

  role(): Role | null {
    return this._user()?.role ?? null;
  }

  getAccessToken(): string | null {
    return this._accessToken();
  }

  login(role: Role, payload: LoginPayload): Observable<User> {
    if (role === 'admin') {
      if (payload.email !== ADMIN_EMAIL || payload.password !== ADMIN_PASSWORD) {
        return throwError(() => ({ error: { message: 'Invalid email or password.' } }));
      }
      const adminUser: User = { id: 'admin-1', role: 'admin', name: 'Lucen Admin', email: payload.email, status: 'active' };
      this.persistUser(adminUser);
      return new Observable(sub => { sub.next(adminUser); sub.complete(); });
    }

    return this.api.post<WrappedResponse<AuthApiResponse>>('/auth/login', payload).pipe(
      map(res => {
        const { accessToken, user } = res.data;
        this.persistToken(accessToken);
        this.persistUser(user);
        return user;
      }),
      catchError(err => throwError(() => err)),
    );
  }

  signup(role: Role, payload: SignupPayload): Observable<User> {
    return this.api.post<WrappedResponse<AuthApiResponse>>('/auth/signup', { ...payload, role }).pipe(
      map(res => {
        const { accessToken, user } = res.data;
        this.persistToken(accessToken);
        this.persistUser(user);
        return user;
      }),
      catchError(err => throwError(() => err)),
    );
  }

  submitPatientOnboarding(payload: PatientOnboardingPayload): Observable<unknown> {
    return this.api.post('/auth/onboarding/patient', payload);
  }

  refreshToken(): Observable<string> {
    return this.api.post<WrappedResponse<AuthApiResponse>>('/auth/refresh', {}).pipe(
      map(res => {
        const { accessToken, user } = res.data;
        this.persistToken(accessToken);
        this.persistUser(user);
        return accessToken;
      }),
    );
  }

  signOut(): void {
    const token = this._accessToken();
    if (token) {
      this.api.post('/auth/logout', {}).subscribe({ error: () => {} });
    }
    this._user.set(null);
    this._accessToken.set(null);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(TOKEN_KEY);
  }

  private persistUser(user: User): void {
    this._user.set(user);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  }

  private persistToken(token: string): void {
    this._accessToken.set(token);
    localStorage.setItem(TOKEN_KEY, token);
  }

  private rehydrateUser(): User | null {
    try {
      const raw = localStorage.getItem(USER_KEY);
      return raw ? (JSON.parse(raw) as User) : null;
    } catch {
      return null;
    }
  }

  private rehydrateToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }
}
