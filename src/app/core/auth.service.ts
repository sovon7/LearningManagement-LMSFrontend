import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { map, tap } from 'rxjs';

export type UserRole = 'ADMIN' | 'CANDIDATE' | 'admin' | 'candidate';

export interface AuthUser {
  userId: string;
  userName: string;
  userEmail: string;
  userRole: UserRole;
  role?: UserRole;
  id?: string;
  name?: string;
  email?: string;
}

export interface LoginResponse {
  token: string;
  user: AuthUser;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly tokenKey = 'lms_token';
  private readonly userKey = 'lms_user';

  readonly currentUser = signal<AuthUser | null>(this.getStoredUser());
  readonly isAuthenticated = signal(this.hasToken());

  constructor(
    private readonly http: HttpClient,
    private readonly router: Router
  ) {}

  login(userEmail: string, password: string) {
    return this.http
      .post<LoginResponse>('http://localhost:5000/api/admin/auth/login', { userEmail, password })
      .pipe(
        tap((response) => {
          this.persistSession(response.token, response.user);
        }),
        map(() => true)
      );
  }

  register(userName: string, userEmail: string, password: string) {
    return this.http
      .post<LoginResponse>('http://localhost:5000/api/admin/auth/register', {
        userName,
        userEmail,
        password,
        userRole: 'CANDIDATE'
      })
      .pipe(
        tap((response) => {
          this.persistSession(response.token, response.user);
        }),
        map(() => true)
      );
  }

  logout() {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.userKey);
    this.currentUser.set(null);
    this.isAuthenticated.set(false);
    this.router.navigateByUrl('/admin/login');
  }

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  isAdmin(): boolean {
    const role = this.currentUser()?.userRole ?? this.currentUser()?.role ?? 'CANDIDATE';
    return String(role).toUpperCase() === 'ADMIN';
  }

  private persistSession(token: string, user: AuthUser) {
    const normalizedUser: AuthUser = {
      ...user,
      userRole: (user.userRole || user.role || 'CANDIDATE') as UserRole,
      userName: user.userName || user.name || 'User',
      userEmail: user.userEmail || user.email || '',
      userId: user.userId || user.id || '',
      role: (user.userRole || user.role || 'CANDIDATE') as UserRole,
      name: user.userName || user.name || 'User',
      email: user.userEmail || user.email || '',
      id: user.userId || user.id || ''
    };

    localStorage.setItem(this.tokenKey, token);
    localStorage.setItem(this.userKey, JSON.stringify(normalizedUser));
    this.currentUser.set(normalizedUser);
    this.isAuthenticated.set(true);
  }

  private getStoredUser(): AuthUser | null {
    const user = localStorage.getItem(this.userKey);
    if (!user) {
      return null;
    }

    try {
      return JSON.parse(user) as AuthUser;
    } catch {
      return null;
    }
  }

  private hasToken(): boolean {
    return !!this.getToken();
  }
}
