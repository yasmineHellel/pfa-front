import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(route: ActivatedRouteSnapshot): boolean {
    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/login']);
      return false;
    }

    const roles = route.data['roles'] as string[] | undefined;
    if (roles && !roles.includes(this.authService.getRole())) {
      this.router.navigate([this.authService.getHomeRoute()]);
      return false;
    }

    return true;
  }
}
