import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
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
  private _authService = inject(AuthService);
  private _userService = inject(UserService);
  private _courseService = inject(CourseService);
  private _route = inject(ActivatedRoute);
  private _router = inject(Router);
  private _fb = inject(FormBuilder);

  user: User | null = null;
  course: Course[] = [];
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
    const userID = this._route.snapshot.paramMap.get('id');
    this.currentUserId = this._userService.getCurrentUserId();
    if (userID) {
      this.loadUserProfile(parseInt(userID));
      this.loadUserCourses(parseInt(userID));
    } else {
      this.errorMessage = 'Curso no encontrado';
      this.isLoading = false;
    }
  }

  loadUserProfile(userId: number): void {
    this.isLoading = true;
    this._userService.getUserById(userId).subscribe({
      next: (user) => {
        this.user = user;
        this.profileForm.patchValue({
          firstName: user.firstName,
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

  loadUserCourses(userId: number): void {
    const user_id = this._userService.getCurrentUserId();
    this._courseService.allCourses().subscribe({
      next: (courses) => {
        courses.map((user_course) => {
          let user_course_id = user_course.user_id;
          if (user_course_id === user_id) {
            this.userCourses.push(user_course);
          }
        });
      },
      error: (err) => {
        console.error('Error al cargar cursos del usuario:', err);
      },
    });
  }

  onSubmit(): void {
    if (this.profileForm.invalid || !this.currentUserId) {
      this.errorMessage = 'Por favor, corrige los errores en el formulario';
      return;
    }

    this.isLoading = true;

    const updatedData = {
      ...this.profileForm.value,
      fristName: this.profileForm.value.firstName,
      biography: this.profileForm.value.bio,
    };

    this._userService.updatedUser(this.currentUserId, updatedData).subscribe({
      next: (response) => {
        this.user = response;
        this.successMessage = 'Perfil actualizado exitosamente';
        this.isEditing = false;
        this.isLoading = false;
        setTimeout(() => (this.successMessage = null), 3000);
      },
      error: (err) => {
        this.errorMessage = 'Error al actualizar el perfil';
        this.isLoading = false;
      },
    });
  }

  toggleEdit(): void {
    this.isEditing = !this.isEditing;
    this.errorMessage = null;
    this.successMessage = null;
    if (!this.isEditing && this.user) {
      this.profileForm.patchValue({
        firstName: this.user.firstName,
        lastName: this.user.lastName,
        email: this.user.email,
        phone: this.user.phone || '',
        bio: this.user.biography || '',
      });
    }
  }

  navigateToCourse(courseId: number): void {
    this._router.navigate(['/course-details', courseId]);
  }

  navigateToHome(): void {
    this._router.navigate(['/home']);
  }

  navigateToEditCourse(id: number): void {
     this._router.navigate(['edit/' + id]);
  }

   navigateToCreateCourse(): void {
    this._router.navigate(['/createCourse']);
  }

  getInitials(): string {
    if (!this.user) return 'U';
    const firstName = this.user.firstName || '';
    const lastName = this.user.lastName || '';
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  }

  getFullName(): string {
    if (!this.user) return 'Usuario';
    return (
      `${this.user.firstName || ''} ${this.user.lastName || ''}`.trim() ||
      'Usuario'
    );
  }
}
