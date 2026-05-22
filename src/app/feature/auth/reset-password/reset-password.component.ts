import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  AbstractControl,
  FormGroup,
  FormControl,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

function passwordMatchValidator(control: AbstractControl) {
  const password = control.get('password');
  const confirmPassword = control.get('confirmPassword');
  if (!password || !confirmPassword) return null;
  if (password.value === confirmPassword.value) return null;
  confirmPassword.setErrors({ mismatch: true });
  return { mismatch: true };
}

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="container min-vh-100 d-flex align-items-center justify-content-center py-5">
      <div class="row justify-content-center w-100">
        <div class="col-12 col-sm-10 col-md-8 col-lg-6 col-xl-5">

          <div class="card border-0 shadow-lg rounded-4">
            <div class="card-body p-4 p-md-5">

              <div class="text-center mb-4">
                <div class="bg-primary bg-opacity-10 rounded-circle d-inline-flex p-3 mb-3">
                  <i class="bi bi-shield-lock fs-1 text-primary"></i>
                </div>
                <h2 class="h3 fw-semibold text-dark mb-2">Nueva contraseña</h2>
                <p class="text-secondary small mb-0">Ingresa y confirma tu nueva contraseña</p>
              </div>

              <div *ngIf="errorMessage" class="alert alert-danger alert-dismissible fade show rounded-3" role="alert">
                <i class="bi bi-exclamation-triangle-fill me-2"></i>
                {{ errorMessage }}
                <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
              </div>

              <div *ngIf="successMessage" class="alert alert-success alert-dismissible fade show rounded-3" role="alert">
                <i class="bi bi-check-circle-fill me-2"></i>
                {{ successMessage }}
                <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
              </div>

              <form [formGroup]="resetForm" (ngSubmit)="submitReset()">

                <div class="mb-4">
                  <label for="password" class="form-label fw-semibold text-secondary small text-uppercase mb-2">
                    <i class="bi bi-lock me-1"></i> Nueva contraseña
                  </label>
                  <input type="password" class="form-control form-control-lg rounded-3 border-0 bg-light"
                    id="password" formControlName="password" placeholder="Mínimo 6 caracteres"
                    [class.is-invalid]="resetForm.get('password')?.invalid && resetForm.get('password')?.touched">
                  <div class="invalid-feedback small mt-1">
                    <i class="bi bi-info-circle me-1"></i>
                    La contraseña debe tener al menos 6 caracteres
                  </div>
                </div>

                <div class="mb-4">
                  <label for="confirmPassword" class="form-label fw-semibold text-secondary small text-uppercase mb-2">
                    <i class="bi bi-shield-lock me-1"></i> Confirmar contraseña
                  </label>
                  <input type="password" class="form-control form-control-lg rounded-3 border-0 bg-light"
                    id="confirmPassword" formControlName="confirmPassword" placeholder="Repite tu contraseña"
                    [class.is-invalid]="(resetForm.get('confirmPassword')?.invalid || resetForm.hasError('mismatch')) && resetForm.get('confirmPassword')?.touched">
                  <div *ngIf="resetForm.hasError('mismatch') && resetForm.get('confirmPassword')?.touched" class="text-danger small mt-1">
                    <i class="bi bi-info-circle me-1"></i>
                    Las contraseñas no coinciden
                  </div>
                  <div *ngIf="!resetForm.hasError('mismatch')" class="invalid-feedback small mt-1">
                    <i class="bi bi-info-circle me-1"></i>
                    Confirma tu nueva contraseña
                  </div>
                </div>

                <div class="d-grid gap-2 mt-4">
                  <button type="submit" class="btn btn-primary btn-lg rounded-3 fw-semibold py-3 shadow-sm"
                    [disabled]="loading || resetForm.invalid">
                    <div *ngIf="loading" class="d-flex align-items-center justify-content-center gap-2">
                      <span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                      <span>Actualizando...</span>
                    </div>
                    <div *ngIf="!loading">
                      <i class="bi bi-check-circle me-2"></i>
                      Cambiar contraseña
                    </div>
                  </button>
                </div>

              </form>

              <div class="position-relative my-4">
                <hr class="text-secondary opacity-25">
                <span class="position-absolute top-50 start-50 translate-middle bg-white px-3 small text-secondary">
                  ¿Ya tienes cuenta?
                </span>
              </div>

              <div class="text-center">
                <button type="button" class="btn btn-outline-secondary rounded-3 fw-semibold px-4 py-2"
                  (click)="goToLogin()">
                  <i class="bi bi-box-arrow-in-left me-2"></i>
                  Ir al inicio de sesión
                </button>
              </div>

            </div>
          </div>

          <div class="text-center mt-4">
            <small class="text-secondary opacity-50">
              © 2026 - Cursos Holguín
            </small>
          </div>

        </div>
      </div>
    </div>
  `,
})
export class ResetPasswordComponent {
  private _authService: AuthService = inject(AuthService);
  private _route = inject(ActivatedRoute);

  errorMessage: string = '';
  successMessage: string = '';
  loading: boolean = false;
  token: string | null = null;

  resetForm = new FormGroup(
    {
      password: new FormControl('', [
        Validators.required,
        Validators.minLength(6),
      ]),
      confirmPassword: new FormControl('', [Validators.required]),
    },
    { validators: passwordMatchValidator }
  );

  constructor(private router: Router) {
    this.token = this._route.snapshot.paramMap.get('token');
  }

  submitReset() {
    this.loading = true;
    this.errorMessage = '';
    this.successMessage = '';

    if (!this.resetForm.valid || !this.token) {
      this.errorMessage = 'Por favor, completa todos los campos correctamente.';
      this.loading = false;
      return;
    }

    const newPassword = this.resetForm.value.password ?? '';

    this._authService.confirmResetPassword(this.token, newPassword).subscribe({
      next: (response: any) => {
        this.successMessage = response.message;
        this.loading = false;
        setTimeout(() => {
          this.router.navigate(['/login']);
        }, 3000);
      },
      error: (error: any) => {
        console.error('Error en reset password:', error);
        this.errorMessage = error.error?.message || 'Error al restablecer la contraseña.';
        this.loading = false;
      },
    });
  }

  goToLogin() {
    this.router.navigate(['/login']);
  }
}
