import { Injectable, inject, signal } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { map, catchError, shareReplay, tap } from 'rxjs/operators';
import {
  LoginPayload,
  MeResponse,
  PatientOnboardingPayload,
  Role,
  SignupPayload,
  User,
} from './auth.models';
import { ApiService } from '../api/api.service';
import { WrappedResponse } from '../api/wrapped-response.model';

interface AuthApiResponse {
  accessToken: string;
  user: User;
}

const USER_KEY       = 'lc_auth_user';
const TOKEN_KEY      = 'lc_auth_token';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly api = inject(ApiService);

  private readonly _user         = signal<User | null>(this.rehydrateUser());
  private readonly _accessToken  = signal<string | null>(this.rehydrateToken());

  readonly user = this._user.asReadonly();

  // GET /auth/me is hit by route guards, which can fire several times during a
  // single navigation. Share one in-flight/most-recent result until invalidated.
  private me$?: Observable<MeResponse>;
  private readonly _me = signal<MeResponse | null>(null);
  readonly meState = this._me.asReadonly();

  isAuthenticated(): boolean {
    return this._user() !== null;
  }

  role(): Role | null {
    return this._user()?.role ?? null;
  }

  getAccessToken(): string | null {
    return this._accessToken();
  }

  /**
   * `role` is sent as part of the credential, not as a hint — the API rejects an
   * account signing in from a portal that is not its own with the same generic
   * 401 as a wrong password.
   */
  login(role: Role, payload: LoginPayload): Observable<User> {
    return this.api.post<WrappedResponse<AuthApiResponse>>('/auth/login', { ...payload, role }).pipe(
      map(res => {
        const { accessToken, user } = res.data;
        this.persistToken(accessToken);
        this.persistUser(user);
        this.invalidateMe();
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
        this.invalidateMe();
        return user;
      }),
      catchError(err => throwError(() => err)),
    );
  }

  /**
   * Live account state — status, plus the application or organisation for this
   * role. The access token carries no status claim, so this is how the client
   * learns an admin has approved (or rejected) the account.
   */
  me(forceRefresh = false): Observable<MeResponse> {
    if (forceRefresh) this.invalidateMe();

    this.me$ ??= this.api.getData<MeResponse>('/auth/me').pipe(
      tap(me => {
        this._me.set(me);
        // Keep the cached user in step with the server's view of it.
        this.persistUser({
          id: me.id,
          role: me.role,
          name: me.name ?? this._user()?.name ?? '',
          email: me.email,
          status: me.status,
        });
      }),
      shareReplay({ bufferSize: 1, refCount: false }),
      catchError(err => {
        this.me$ = undefined; // never cache a failure
        return throwError(() => err);
      }),
    );

    return this.me$;
  }

  invalidateMe(): void {
    this.me$ = undefined;
    this._me.set(null);
  }

  submitPatientOnboarding(payload: PatientOnboardingPayload): Observable<unknown> {
    return this.api.postData<unknown>('/auth/onboarding/patient', payload);
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
    this.invalidateMe();
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
