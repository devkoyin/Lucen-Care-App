import { Injectable, signal } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { LoginPayload, Role, SignupPayload, User } from './auth.models';

// Swap these for a real API call when the backend is ready
const ADMIN_EMAIL    = 'admin@lucencare.com';
const ADMIN_PASSWORD = 'Admin@1234';
const STORAGE_KEY    = 'lc_auth_user';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly _user = signal<User | null>(this.rehydrate());

  readonly user = this._user.asReadonly();

  isAuthenticated(): boolean {
    return this._user() !== null;
  }

  role(): Role | null {
    return this._user()?.role ?? null;
  }

  login(role: Role, payload: LoginPayload): Observable<User> {
    if (role === 'admin') {
      if (payload.email !== ADMIN_EMAIL || payload.password !== ADMIN_PASSWORD) {
        return throwError(() => new Error('Invalid email or password.'));
      }
      const user: User = { id: 'admin-1', role: 'admin', name: 'Lucen Admin', email: payload.email, status: 'active' };
      this.persist(user);
      return of(user);
    }

    const user: User = { id: 'stub-1', role, name: 'Demo User', email: payload.email, status: 'active' };
    this.persist(user);
    return of(user);
  }

  signup(role: Role, payload: SignupPayload): Observable<User> {
    const user: User = {
      id: 'stub-' + Date.now(),
      role,
      name: payload.name,
      email: payload.email,
      status: role === 'patient' ? 'active' : 'pending',
    };
    this.persist(user);
    return of(user);
  }

  signOut(): void {
    this._user.set(null);
    localStorage.removeItem(STORAGE_KEY);
  }

  private persist(user: User): void {
    this._user.set(user);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
  }

  private rehydrate(): User | null {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? (JSON.parse(raw) as User) : null;
    } catch {
      return null;
    }
  }
}
