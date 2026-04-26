import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormGroup,
  FormControl,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';
import md5 from 'md5';

import { AuthService } from '../../../core/services/auth.service';
import { UserService } from '../../../core/services/user.service.service';

@Component({
  selector: 'app-sign-up',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './sign-up.component.html',
  styleUrls: ['./sign-up.component.scss'],
})
export class SignUpComponent {
  private _authService = inject(AuthService);
  private _userService = inject(UserService);
  private _router = inject(Router);

  errorMessage: string = '';
  loading: boolean = false;

  /**
   * FORM
   */
  signUpForm = new FormGroup({
    firstName: new FormControl('', [
      Validators.required,
      Validators.minLength(2),
      Validators.maxLength(50),
    ]),
    lastName: new FormControl('', [
      Validators.required,
      Validators.minLength(2),
      Validators.maxLength(50),
    ]),
    email: new FormControl('', [Validators.required, Validators.email]),
    birthday: new FormControl('', [
      Validators.required,
      (control) => {
        const selectedDate = new Date(control.value);
        const limitDate = new Date('2014-01-01');
        return selectedDate > limitDate ? { invalidAge: true } : null;
      },
    ]),
    phone: new FormControl(''),
    entity_type: new FormControl('privado'),
    password: new FormControl('', [
      Validators.required,
      Validators.minLength(6),

      Validators.pattern(/^(?=.*[A-Z])(?=.*[0-9])/),
    ]),
  });

  submit(): void {
    if (this.signUpForm.invalid) {
      this.errorMessage =
        'Por favor, completa los campos correctamente siguiendo las reglas indicadas.';
      this.signUpForm.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    // Preparación de datos
    const rawValues = this.signUpForm.value;
    const encryptedPassword = md5(rawValues.password ?? '').toString();

    const signUpData = {
      firstName: rawValues.firstName,
      lastName: rawValues.lastName,
      email: rawValues.email,
      birthday: rawValues.birthday,
      phone: rawValues.phone || undefined,
      entity_type: rawValues.entity_type,
      password: encryptedPassword,
    };

    this._userService.signUp(signUpData).subscribe({
      next: (response: any) => {
        this.loading = false;

        if (response.token && response.user) {
          this._authService.saveAuthData(
            response.token,
            response.user.email,
            response.user.id,
            response.user.firstName,
            response.user.role,
          );
          this._router.navigate(['/login']);
        } else {
          this._router.navigate(['/login']);
        }
      },
      error: (error: any) => {
        this.loading = false;
        console.error('Error en registro:', error);

        if (error.error?.errors && Array.isArray(error.error.errors)) {
          this.errorMessage = error.error.errors[0].msg;
        } else {
          this.errorMessage =
            error.error?.message || 'Error al conectar con el servidor.';
        }
      },
    });
  }

  goToLogin(): void {
    this._router.navigate(['/login']);
  }
}
