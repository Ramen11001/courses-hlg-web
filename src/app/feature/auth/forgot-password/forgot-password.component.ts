import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormGroup,
  FormControl,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from 'src/app/core/services/auth.service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './forgot-password.component.html',
  styleUrls: ['./forgot-password.component.scss'],
})
export class ForgotPasswordComponent implements OnInit {
  private _authService: AuthService = inject(AuthService);

  errorMessage: string = '';
  successMessage: string = '';
  loading: boolean = false;
  step: 'request' | 'reset' = 'request';
  token: string | null = null;

  forgotForm = new FormGroup({
    email: new FormControl(null, [Validators.required, Validators.email]),
  });

  resetForm = new FormGroup({
    password: new FormControl(null, [
      Validators.required,
      Validators.minLength(6),
    ]),
    confirmPassword: new FormControl(null, [Validators.required]),
  });

  constructor(
    private router: Router,
    private route: ActivatedRoute,
  ) {}

  ngOnInit(): void {
    // Check if there is a token in the URL (for the reset step)
    this.token = this.route.snapshot.queryParamMap.get('token');
    if (this.token) {
      this.step = 'reset';
    }
  }

  submitForgot() {
    this.loading = true;
    this.errorMessage = '';
    this.successMessage = '';

    if (!this.forgotForm.valid) {
      this.errorMessage = 'Por favor, ingresa un correo electrónico válido.';
      this.loading = false;
      return;
    }

    const data = {
      email: this.forgotForm.value.email,
    };

    this._authService.forgotPassword(data).subscribe({
      next: (response: any) => {
        this.successMessage = response.message;

        if (response.resetToken) {
          this.token = response.resetToken;
        }

        this.loading = false;
      },
      error: (error: any) => {
        console.error('Error en forgot password:', error);
        this.errorMessage =
          error.error?.message ||
          'Error al procesar la solicitud. Intenta nuevamente.';
        this.loading = false;
      },
    });
  }

  submitReset() {
    this.loading = true;
    this.errorMessage = '';
    this.successMessage = '';

    if (!this.resetForm.valid) {
      this.errorMessage = 'Por favor, completa todos los campos correctamente.';
      this.loading = false;
      return;
    }

    const password = this.resetForm.value.password ?? '';
    const confirmPassword = this.resetForm.value.confirmPassword ?? '';

    if (password !== confirmPassword) {
      this.errorMessage = 'Las contraseñas no coinciden.';
      this.loading = false;
      return;
    }

    if (!this.token) {
      this.errorMessage = 'Token de recuperación no encontrado.';
      this.loading = false;
      return;
    }

    const data = {
      token: this.token,
      newPassword: password,
    };

    this._authService.resetPassword(data).subscribe({
      next: (response: any) => {
        this.successMessage = response.message;
        setTimeout(() => {
          this.router.navigate(['/login']);
        }, 3000);
        this.loading = false;
      },
      error: (error: any) => {
        console.error('Error en reset password:', error);
        this.errorMessage =
          error.error?.message || 'Error al restablecer la contraseña.';
        this.loading = false;
      },
    });
  }

  goToLogin() {
    this.router.navigate(['/login']);
  }
}
