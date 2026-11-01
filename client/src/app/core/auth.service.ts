import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, catchError, map, of, tap } from 'rxjs';
import { AuthResponse, User } from './models';

const TOKEN_KEY = 'efashion_token';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);

  readonly user = signal<User | null>(null);
  readonly isLoggedIn = computed(() => !!this.user());
  readonly isAdmin = computed(() => this.user()?.role === 'ADMIN');

  get token(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  login(email: string, password: string) {
    return this.http.post<AuthResponse>('/api/auth/login', { email, password }).pipe(tap((r) => this.store(r)));
  }

  register(fullName: string, email: string, password: string) {
    return this.http
      .post<AuthResponse>('/api/auth/register', { fullName, email, password })
      .pipe(tap((r) => this.store(r)));
  }

  /** Restaure la session au démarrage / dans les guards. */
  ensureUser(): Observable<User | null> {
    if (this.user()) return of(this.user());
    if (!this.token) return of(null);
    return this.http.get<User>('/api/auth/me').pipe(
      tap((u) => this.user.set(u)),
      catchError(() => {
        this.clear();
        return of(null);
      }),
      map((u) => u),
    );
  }

  logout() {
    this.clear();
    this.router.navigateByUrl('/login');
  }

  private store(r: AuthResponse) {
    localStorage.setItem(TOKEN_KEY, r.token);
    this.user.set(r.user);
  }

  clear() {
    localStorage.removeItem(TOKEN_KEY);
    this.user.set(null);
  }
}
