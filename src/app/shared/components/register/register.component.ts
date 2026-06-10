import { Component } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, ValidationErrors, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

function passwordsMatch(g: AbstractControl): ValidationErrors | null {
  const pw  = g.get('password')?.value;
  const cpw = g.get('confirmPassword')?.value;
  return pw && cpw && pw !== cpw ? { mismatch: true } : null;
}

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent {
  form: FormGroup;
  selectedRole: 'MECANICIEN' | 'FOURNISSEUR' | '' = '';
  showPassword = false;
  loading = false;
  error = '';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.form = this.fb.group({
      role:            ['', Validators.required],
      firstName:       ['', Validators.required],
      lastName:        ['', Validators.required],
      email:           ['', [Validators.required, Validators.email]],
      phone:           [''],
      company:         [''],
      password:        ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required],
    }, { validators: passwordsMatch });

    if (this.authService.isLoggedIn()) {
      this.router.navigate([this.authService.getHomeRoute()]);
    }
  }

  selectRole(role: 'MECANICIEN' | 'FOURNISSEUR'): void {
    this.selectedRole = role;
    this.form.patchValue({ role });
    const companyCtrl = this.form.get('company')!;
    if (role === 'FOURNISSEUR') {
      companyCtrl.setValidators(Validators.required);
    } else {
      companyCtrl.clearValidators();
      companyCtrl.setValue('');
    }
    companyCtrl.updateValueAndValidity();
  }

  invalid(field: string): boolean {
    const c = this.form.get(field);
    return !!(c?.invalid && c.touched);
  }

  onSubmit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.loading = true;
    this.error   = '';
    const { confirmPassword, ...data } = this.form.value;
    this.authService.register(data).subscribe({
      next: () => this.router.navigate([this.authService.getHomeRoute()]),
      error: err => {
        this.error   = err.error?.message || 'Erreur lors de l\'inscription.';
        this.loading = false;
      }
    });
  }
}
