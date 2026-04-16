import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { UserService } from 'src/app/core/services/user.service.service';
import { AuthService } from 'src/app/core/services/auth.service';
import { User } from 'src/app/core/interfaces/user';

@Component({
  selector: 'app-user-edit',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './supplier-edit.html',
})
export class UserEditComponent implements OnInit {
  private _userService: UserService = inject(UserService);
  private _authService: AuthService = inject(AuthService);
  private _route: ActivatedRoute = inject(ActivatedRoute);
  private _router: Router = inject(Router);
  private _fb: FormBuilder = inject(FormBuilder);

  user: User | null = null;
  userForm: FormGroup;
  isLoading = true;
  isSaving = false;
  errorMessage: string | null = null;
  successMessage: string | null = null;
  userId: number | null = null;
  currentUserRole: string | null = null;

  availableRoles = [
    { value: 'USER', label: 'Usuario', icon: 'bi-person', color: 'secondary' },
    {
      value: 'COURSE_SUPPLIER',
      label: 'Profesor',
      icon: 'bi-person-badge',
      color: 'primary',
    },
    {
      value: 'ADMIN',
      label: 'Administrador',
      icon: 'bi-shield-lock',
      color: 'danger',
    },
  ];

  constructor() {
    this.userForm = this._fb.group({
      firstName: ['', [Validators.required, Validators.minLength(2)]],
      lastName: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.pattern(/^[0-9+\-\s]+$/)]],
      bio: ['', [Validators.maxLength(500)]],
      role: ['', [Validators.required]],
    });
  }

  ngOnInit(): void {
    this.userId = this._route.snapshot.paramMap.get('id')
      ? parseInt(this._route.snapshot.paramMap.get('id')!)
      : null;
    this.currentUserRole = this._authService.getCurrentUserName();

    // Verificar permisos de administrador
    if (this.currentUserRole !== 'ADMIN') {
      this.errorMessage = 'No tienes permisos para editar usuarios';
      this.isLoading = false;
      return;
    }

    if (this.userId) {
      this.loadUser();
    } else {
      this.errorMessage = 'ID de usuario no válido';
      this.isLoading = false;
    }
  }

  loadUser(): void {
    this.isLoading = true;
    this._userService.getUserById(this.userId!).subscribe({
      next: (user) => {
        this.user = user;
        this.userForm.patchValue({
          firstName: user.fristName,
          lastName: user.lastName,
          email: user.email,
          phone: user.phone || '',
          bio: user.biography || '',
          role: user.role,
        });
        this.isLoading = false;
      },
      error: (err) => {
        this.errorMessage = 'Error al cargar los datos del usuario';
        this.isLoading = false;
        console.error(err);
      },
    });
  }

  onSubmit(): void {
    if (this.userForm.invalid) {
      this.errorMessage = 'Por favor, corrige los errores en el formulario';
      return;
    }

    this.isSaving = true;
    this.errorMessage = null;
    this.successMessage = null;

    const updatedUser = {
      ...this.userForm.value,
      id: this.userId,
    };

    this._userService.updatedUser(this.userId!, updatedUser).subscribe({
      next: (response) => {
        this.user = response;
        this.successMessage = 'Usuario actualizado exitosamente';
        this.isSaving = false;

        setTimeout(() => {
          this.successMessage = null;
        }, 3000);
      },
      error: (err) => {
        this.errorMessage =
          err.error?.message || 'Error al actualizar el usuario';
        this.isSaving = false;
        console.error(err);
      },
    });
  }

  navigateToBack(): void {
    this._router.navigate(['/admin/users']);
  }

  navigateToUserProfile(): void {
    this._router.navigate(['/user', this.userId]);
  }

  getInitials(): string {
    if (!this.user) return 'U';
    const firstName = this.user.fristName || '';
    const lastName = this.user.lastName || '';
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  }

  getFullName(): string {
    if (!this.user) return 'Usuario';
    return (
      `${this.user.fristName || ''} ${this.user.lastName || ''}`.trim() ||
      'Usuario'
    );
  }

  getRoleLabel(role: string): string {
    const found = this.availableRoles.find((r) => r.value === role);
    return found ? found.label : role;
  }

  getRoleColor(role: string): string {
    const found = this.availableRoles.find((r) => r.value === role);
    return found ? found.color : 'secondary';
  }

  getRoleIcon(role: string): string {
    const found = this.availableRoles.find((r) => r.value === role);
    return found ? found.icon : 'bi-person';
  }
}
