import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { AuthResponse, BackendAuthResponse, LoginRequest, RegisterRequest, User } from '../models/auth.models';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly TOKEN_KEY = 'garage_token';
  private readonly USER_KEY  = 'garage_user';
  private readonly baseUrl   = `${environment.authUrl}/auth`;

  constructor(private http: HttpClient, private router: Router) {}

  login(credentials: LoginRequest): Observable<AuthResponse> {
    return this.http.post<BackendAuthResponse>(`${this.baseUrl}/login`, {
      username: credentials.email,
      password: credentials.password
    }).pipe(
      map(res => this.mapResponse(res)),
      tap(res => this.storeSession(res))
    );
  }

  register(data: RegisterRequest): Observable<AuthResponse> {
    return this.http.post<BackendAuthResponse>(`${this.baseUrl}/register`, {
      username:  data.email,
      email:     data.email,
      password:  data.password,
      firstName: data.firstName,
      lastName:  data.lastName,
      role:      data.role,
      phone:     data.phone    || '',
      company:   data.company  || ''
    }).pipe(
      map(res => ({
        token: res.accessToken,
        user: {
          id:        res.userId,
          firstName: data.firstName,
          lastName:  data.lastName,
          email:     res.email,
          role:      res.role as any,
        },
      })),
      tap(res => this.storeSession(res))
    );
  }

  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    this.router.navigate(['/login']);
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  getCurrentUser(): User | null {
    const u = localStorage.getItem(this.USER_KEY);
    return u ? JSON.parse(u) : null;
  }

  getRole(): string {
    return this.getCurrentUser()?.role || '';
  }

  isLoggedIn(): boolean {
    return !!this.getToken() && !!this.getCurrentUser();
  }

  getHomeRoute(): string {
    const role = this.getRole();
    if (role === 'MECANICIEN')  return '/repairs';
    if (role === 'FOURNISSEUR') return '/stock';
    return '/dashboard';
  }

  private mapResponse(res: BackendAuthResponse): AuthResponse {
    const namePart  = res.username?.split('@')[0] || res.email?.split('@')[0] || 'Utilisateur';
    const firstName = namePart.charAt(0).toUpperCase() + namePart.slice(1);
    const user: User = {
      id:        res.userId,
      firstName,
      lastName:  '',
      email:     res.email,
      role:      res.role as any
    };
    return { token: res.accessToken, user };
  }

  private storeSession(res: AuthResponse): void {
    localStorage.setItem(this.TOKEN_KEY, res.token);
    localStorage.setItem(this.USER_KEY,  JSON.stringify(res.user));
  }
}
