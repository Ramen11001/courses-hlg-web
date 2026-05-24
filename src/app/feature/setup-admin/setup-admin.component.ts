import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import md5 from 'md5';

@Component({
  selector: 'app-setup-admin',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './setup-admin.component.html',
})
export class SetupAdminComponent {
  private _authService = inject(AuthService);
  private _router = inject(Router);
  private _fb = inject(FormBuilder);

  step: 'key' | 'form' | 'loading' | 'done' = 'key';
  errorMessage: string = '';
  successMessage: string = '';

  keyForm: FormGroup = this._fb.group({
    setupKey: ['', [Validators.required, Validators.minLength(8)]],
  });

  adminForm: FormGroup = this._fb.group({
    firstName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
    lastName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8), Validators.pattern(/^(?=.*[A-Z])(?=.*[0-9])/)]],
    confirmPassword: ['', [Validators.required]],
  }, { validators: this.passwordMatchValidator });

  private passwordMatchValidator(g: FormGroup) {
    return g.get('password')?.value === g.get('confirmPassword')?.value
      ? null : { mismatch: true };
  }

  verifyKey(): void {
    if (this.keyForm.invalid) return;
    this.step = 'form';
  }

  goBack(): void {
    this.step = 'key';
    this.errorMessage = '';
  }

  submit(): void {
    if (this.adminForm.invalid) return;

    this.step = 'loading';
    this.errorMessage = '';

    const { firstName, lastName, email, password } = this.adminForm.value;
    const encryptedPassword = md5(password).toString();

    this._authService.setupAdmin({
      setupKey: this.keyForm.value.setupKey,
      firstName,
      lastName,
      email,
      password: encryptedPassword,
      birthday: '1900-01-01',
      entity_type: 'privado',
      phone: '',
    }).subscribe({
      next: () => {
        this.step = 'done';
        this.successMessage = 'Administrador creado exitosamente. Redirigiendo al inicio de sesión...';
        setTimeout(() => this._router.navigate(['/login']), 3000);
      },
      error: (err) => {
        this.step = 'form';
        this.errorMessage = err.error?.error || err.error?.message || 'Error al crear el administrador. Verifica la clave de setup.';
      },
    });
  }
}
