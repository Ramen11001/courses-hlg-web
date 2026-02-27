import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormGroup,
  FormControl,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';

import * as md5 from 'md5';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/core/services/auth.service';
import { first } from 'rxjs';

/**
 * Component representing the login functionality.
 *
 * @component
 * @class LoginComponent
 */
@Component({
  selector: 'app-login',
  standalone: true,
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  imports: [CommonModule, ReactiveFormsModule],
})
export class LoginComponent {
  /**
   * Stores error messages from failed login attempts.
   * @type {string}
   */
  errorMessage: string = '';
  /**
   * Indicates whether the login request is in progress.
   * @type {boolean}
   */
  loading: boolean = false;
  /**
   * Form group for handling login inputs with validation rules.
   * @type {FormGroup}
   */
  loginForm = new FormGroup({
    firstName: new FormControl(null, [
      Validators.required, // firstName is required
      Validators.minLength(3), // Minimum length of 3 characters
    ]),
    lastName: new FormControl(null, [
      Validators.required, // lastName is required
      Validators.minLength(3), // Minimum length of 3 characters
    ]),
    password: new FormControl(null, [
      Validators.required, // Password is required
      Validators.minLength(6), // Minimum length of 6 characters
    ]),
  });

  /**
   * Initializes LoginComponent and redirects authenticated users to the product view.
   *
   * @constructor
   * @param {AuthService} authService - Handles authentication-related requests.
   * @param {Router} router - Manages route navigation.
   */
  constructor(
    private authService: AuthService,
    private router: Router,
  ) { }

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
    this.loading = true; // Show loading indicator
    // Validate the form before proceeding
    if (!this.loginForm.valid) {
      this.errorMessage = 'El formulario no es válido.'; // Display error message in UI
      this.loading = false;
      return;
    }
    // Encrypt the password using MD5
    const password = this.loginForm.value.password ?? '';
    const encryptedPassword = md5(password).toString();

    // Prepare login data object
    const loginData = {
      fristName: this.loginForm.value.firstName,
      lastName: this.loginForm.value.lastName,
      password: encryptedPassword,
    };
    // Call authentication service
    this.authService.login(loginData).subscribe({
      /**
       * Executes when login is successful.
       * - Stores the token in local storage.
       * - Stores the fristName in local storage.
       * - Stores the lastName in local storage.
       * - Redirects the user to the product.
       *
       * @callback
       * @param {object} response - The server's response containing the token.
       */
      next: (response) => {
        const token = response.token;
        const fristName = response.user?.fristName;
        const lastName = response.user?.lastName;
        const user_id = response.user?.id;
        if (!token || !fristName || !lastName || !user_id) {
          console.error('Datos faltantes en respuesta:', response);
          return;
        }

        this.authService.saveAuthData(token, fristName, lastName, user_id);
        this.router.navigate(['/home']);
        this.loading = false;
      },
      /**
       * Executes when login fails.
       * - Displays an error message to the user.
       *
       * @callback
       */
      error: () => {
        this.errorMessage = 'Usuario o contraseña incorrectos'; // Display error message in UI
        this.loading = false;
      },
    });
  }
}
