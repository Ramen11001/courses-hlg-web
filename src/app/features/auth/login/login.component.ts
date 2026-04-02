import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormGroup,
  FormControl,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';

import * as md5 from 'md5';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from 'src/app/core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  imports: [CommonModule, RouterModule, ReactiveFormsModule],
})
export class LoginComponent {
  private _authService: AuthService = inject(AuthService);
  router = inject(Router);

  errorMessage: string = '';
  loading: boolean = false;

  /**
   * Form group for handling login inputs with validation rules.
   * @type {FormGroup}
   */
  loginForm = new FormGroup({
    email: new FormControl(null, [Validators.required, Validators.email]),
    password: new FormControl(null, [
      Validators.required,
      Validators.minLength(6),
    ]),
  });

  /**
   * Handles form submission and authentication.
   * - Validates form input
   * - Encrypts password before sending login request
   * - Stores token upon successful login and redirects user
   * - Displays error message if login fails
   *
   * @function
   */
  submit() {
    this.loading = true;
    if (!this.loginForm.valid) {
      this.errorMessage = 'El formulario no es válido.'; // Display error message in UI
      this.loading = false;
      return;
    }
    // Encrypt the password using MD5
    const password = this.loginForm.value.password ?? '';
    const encryptedPassword = md5(password).toString();
    const loginData = {
      email: this.loginForm.value.email,
      password: encryptedPassword,
    };

    this._authService.login(loginData).subscribe({
      next: (response) => {
        const token = response.token;
        const email = response.user?.email;
        const user_id = response.user?.id;
        if (!token || !email || !user_id) {
          console.error('Datos faltantes en respuesta:', response);
          return;
        }

        this._authService.saveAuthData(token, email, user_id);
        this.router.navigate(['/home']);
        this.loading = false;
      },

      error: () => {
        this.errorMessage = 'Usuario o contraseña incorrectos';
        this.loading = false;
      },
    });
  }
  navigateToSingUp() {
    this.router.navigate(['/singUp']);
  }

  navigateToForgotPassword() {
    this.router.navigate(['/forgotPassword']);
  }
}
