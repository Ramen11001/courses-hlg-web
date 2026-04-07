import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormGroup,
  FormControl,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';

import md5 from 'md5';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';


@Component({
  selector: 'app-sign-up',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './sign-up.component.html',
  styleUrls: ['./sign-up.component.scss'],
})
export class SignUpComponent {
  private _authService: AuthService = inject(AuthService);

  router = inject(Router);
  errorMessage: string = '';
  loading: boolean = false;

  signUpForm = new FormGroup({
    firstName: new FormControl(null, [
      Validators.required,
      Validators.minLength(2),
    ]),
    lastName: new FormControl(null, [
      Validators.required,
      Validators.minLength(2),
    ]),
    email: new FormControl(null, [Validators.required, Validators.email]),
    password: new FormControl(null, [
      Validators.required,
      Validators.minLength(6),
    ]),
  });

  submit() {
    this.loading = true;

    if (!this.signUpForm.valid) {
      this.errorMessage = 'Por favor, completa todos los campos correctamente.';
      this.loading = false;
      return;
    }

    const password = this.signUpForm.value.password ?? '';
    const encryptedPassword = md5(password).toString();

    const signUpData = {
      firstName: this.signUpForm.value.firstName,
      lastName: this.signUpForm.value.lastName,
      email: this.signUpForm.value.email,
      password: encryptedPassword,
    };

    this._authService.signUp(signUpData).subscribe({
      next: (response: any) => {
        if (response.token && response.user) {
          this._authService.saveAuthData(
            response.token,
            response.user.email,
            response.user.id,
            response.user.firstName,
          );
          this.router.navigate(['/login']);
          //TODO: ToastService
        } else {
          this.router.navigate(['/singUp']);
          //TODO: ToastService
        }
        this.loading = false;
      },
      error: (error: any) => {
        console.error('Error en registro:', error);
        this.errorMessage =
          error.error?.message ||
          'Error al crear la cuenta. Intenta nuevamente.';
        this.loading = false;
      },
    });
  }

  goToLogin() {
    this.router.navigate(['/login']);
  }
}
