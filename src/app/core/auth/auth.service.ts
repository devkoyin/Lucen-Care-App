import { Injectable, signal } from '@angular/core';
import { Observable, of } from 'rxjs';
import { LoginPayload, Role, SignupPayload, User } from './auth.models';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly _user = signal<User | null>(null);

  readonly user = this._user.asReadonly();

  isAuthenticated(): boolean {
    return this._user() !== null;
  }

  role(): Role | null {
    return this._user()?.role ?? null;
  }

  login(role: Role, payload: LoginPayload): Observable<User> {
    const user: User = {
      id: 'stub-1',
      role,
      name: 'Demo User',
      email: payload.email,
      status: 'active',
    };
    this._user.set(user);
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
    this._user.set(user);
    return of(user);
  }

  signOut(): void {
    this._user.set(null);
  }
}
