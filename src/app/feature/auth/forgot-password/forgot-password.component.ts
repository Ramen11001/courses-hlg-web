import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  AbstractControl,
  FormGroup,
  FormControl,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';
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
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './forgot-password.component.html',
  styleUrls: ['./forgot-password.component.scss'],
})
export class ForgotPasswordComponent {
  private _authService: AuthService = inject(AuthService);

  errorMessage: string = '';
  successMessage: string = '';
  loading: boolean = false;

  resetForm = new FormGroup(
    {
      email: new FormControl(null, [Validators.required, Validators.email]),
      password: new FormControl(null, [
        Validators.required,
        Validators.minLength(6),
      ]),
      confirmPassword: new FormControl(null, [Validators.required]),
    },
    { validators: passwordMatchValidator }
  );

  constructor(private router: Router) {}

  submitReset() {
    this.loading = true;
    this.errorMessage = '';
    this.successMessage = '';

    if (!this.resetForm.valid) {
      this.errorMessage = 'Por favor, completa todos los campos correctamente.';
      this.loading = false;
      return;
    }

    const data = {
      email: this.resetForm.value.email,
      newPassword: this.resetForm.value.password,
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
