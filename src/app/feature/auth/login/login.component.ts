import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormGroup,
  FormControl,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';

import md5 from 'md5';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  imports: [CommonModule, RouterModule, ReactiveFormsModule],
})
export class LoginComponent {
  private _authService: AuthService = inject(AuthService);
  private _router = inject(Router);

  errorMessage: string = '';
  loading: boolean = false;

  loginForm = new FormGroup({
    email: new FormControl('', [Validators.required, Validators.email]),
    password: new FormControl('', [
      Validators.required,
      Validators.minLength(6),
    ]),
  });

  submit() {
    this.loading = true;
    this.errorMessage = '';

    if (this.loginForm.invalid) {
      this.errorMessage = 'El formulario no es válido.';
      this.loading = false;
      return;
    }

    const email = this.loginForm.value.email ?? '';
    const password = this.loginForm.value.password ?? '';

    const encryptedPassword = md5(password).toString();

    const loginData = {
      email: email,
      password: encryptedPassword,
    };

    this._authService.login(loginData).subscribe({
      next: (response) => {
        const token = response.token;
        const userEmail = response.user?.email;
        const fristName = response.user?.fristName;
        const role = response.user?.role;
        const userId = response.user?.id;

        if (token && userEmail && userId) {
          this._authService.saveAuthData(
            token,
            userEmail,
            userId,
            fristName,
            role,
          );
          //TODO: No va a home
          this.navigateToHome();
          this.loading = true;
        }
      },
      error: (err) => {
        this.errorMessage =
          err.error?.error || 'Usuario o contraseña incorrectos';
        this.loading = false;
      },
    });
  }

  navigateToSingUp() {
    this._router.navigate(['/singUp']);
  }

  navigateToForgotPassword() {
    this._router.navigate(['/forgotPassword']);
  }

  navigateToHome() {
    this._router.navigate(['/home']);
  }
}
