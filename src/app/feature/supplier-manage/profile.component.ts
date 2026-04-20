import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { AuthService } from 'src/app/core/services/auth.service';
import { UserService } from 'src/app/core/services/user.service.service';
import { CourseService } from 'src/app/core/services/course.service';
import { Course } from 'src/app/core/interfaces/course';
import { User } from 'src/app/core/interfaces/user';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './profile.component.html',
})
export class ProfileComponent implements OnInit {
  private _authService: AuthService = inject(AuthService);
  private _userService: UserService = inject(UserService);
  private _courseService: CourseService = inject(CourseService);
  private _router: Router = inject(Router);
  private _fb: FormBuilder = inject(FormBuilder);

  user: User | null = null;
  userCourses: Course[] = [];
  isLoading = true;
  isEditing = false;
  errorMessage: string | null = null;
  successMessage: string | null = null;
  currentUserId: number | null = null;

  profileForm: FormGroup;

  constructor() {
    this.profileForm = this._fb.group({
      firstName: ['', [Validators.required, Validators.minLength(2)]],
      lastName: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.pattern(/^[0-9+\-\s]+$/)]],
      bio: ['', [Validators.maxLength(500)]],
    });
  }

  ngOnInit(): void {
    this.currentUserId = this._userService.getCurrentUserId();
    if (this.currentUserId) {
      this.loadUserProfile();
      this.loadUserCourses();
    } else {
      this.errorMessage = 'No se pudo identificar al usuario';
      this.isLoading = false;
    }
  }

  loadUserProfile(): void {
    this.isLoading = true;
    this._userService.getUserById(this.currentUserId!).subscribe({
      next: (user) => {
        this.user = user;
        this.profileForm.patchValue({
          firstName: user.fristName,
          lastName: user.lastName,
          email: user.email,
          phone: user.phone || '',
          bio: user.biography || '',
        });
        this.isLoading = false;
      },
      error: (err) => {
        this.errorMessage = 'Error al cargar el perfil';
        this.isLoading = false;
        console.error(err);
      },
    });
  }

  loadUserCourses(): void {
    //TODO:
    this._courseService.getCourseByUserId(this.currentUserId!).subscribe({
      next: (courses: any) => {
        this.userCourses = courses;
      },
      error: (err: any) => {
        console.error('Error al cargar cursos del usuario:', err);
      },
    });
  }

  toggleEdit(): void {
    this.isEditing = !this.isEditing;
    this.errorMessage = null;
    this.successMessage = null;
    if (!this.isEditing && this.user) {
      this.profileForm.patchValue({
        firstName: this.user.fristName,
        lastName: this.user.lastName,
        email: this.user.email,
        phone: this.user.phone || '',
        bio: this.user.biography || '',
      });
    }
  }

  onSubmit(): void {
    if (this.profileForm.invalid) {
      this.errorMessage = 'Por favor, corrige los errores en el formulario';
      return;
    }

    this.isLoading = true;
    this.errorMessage = null;
    this.successMessage = null;

    const updatedUser = {
      ...this.profileForm.value,
      id: this.currentUserId,
    };

    this._userService.updatedUser(this.currentUserId!, updatedUser).subscribe({
      next: (response) => {
        this.user = response;
        this.successMessage = 'Perfil actualizado exitosamente';
        this.isEditing = false;
        this.isLoading = false;

        setTimeout(() => {
          this.successMessage = null;
        }, 3000);
      },
      error: (err) => {
        this.errorMessage = 'Error al actualizar el perfil';
        this.isLoading = false;
        console.error(err);
      },
    });
  }

  navigateToCourse(courseId: number): void {
    this._router.navigate(['/course-details', courseId]);
  }

  navigateToEditCourse(courseId: number): void {
    this._router.navigate(['/edit-course', courseId]);
  }

  navigateToCreateCourse(): void {
    this._router.navigate(['/create-course']);
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
}
