import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormGroup,
  FormControl,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

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

  forgotForm = new FormGroup({
    email: new FormControl('', [Validators.required, Validators.email]),
  });

  constructor(private router: Router) {}

  submitForgot() {
    this.loading = true;
    this.errorMessage = '';
    this.successMessage = '';

    if (this.forgotForm.invalid) {
      this.errorMessage = 'Por favor, ingresa un correo válido.';
      this.loading = false;
      return;
    }

    const email = this.forgotForm.value.email ?? '';

    this._authService.forgotPassword(email).subscribe({
      next: (response: any) => {
        this.successMessage = response.message;
        this.loading = false;
      },
      error: (error: any) => {
        console.error('Error en forgot password:', error);
        this.errorMessage = error.error?.message || 'Error al procesar la solicitud.';
        this.loading = false;
      },
    });
  }

  goToLogin() {
    this.router.navigate(['/login']);
  }
}
