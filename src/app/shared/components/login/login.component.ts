import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  form: FormGroup;
  loading = false;
  error = '';
  showPassword = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.form = this.fb.group({
      email:    ['', [Validators.required, Validators.email]],
      password: ['', Validators.required]
    });

    if (this.authService.isLoggedIn()) {
      this.router.navigate([this.authService.getHomeRoute()]);
    }
  }

  fillDemo(role: 'ADMIN' | 'MECANICIEN' | 'FOURNISSEUR'): void {
    const creds: Record<string, { email: string; password: string }> = {
      ADMIN:       { email: 'admin@garage.com',       password: 'admin123' },
      MECANICIEN:  { email: 'mecanicien@garage.com',  password: 'meca123'  },
      FOURNISSEUR: { email: 'fournisseur@garage.com', password: 'four123'  },
    };
    this.form.patchValue(creds[role]);
  }

  onSubmit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.loading = true;
    this.error   = '';

    this.authService.login(this.form.value).subscribe({
      next: () => this.router.navigate([this.authService.getHomeRoute()]),
      error: () => {
        this.error   = 'Email ou mot de passe incorrect.';
        this.loading = false;
      }
    });
  }
}
