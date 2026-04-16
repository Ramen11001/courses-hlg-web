import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { UserService } from 'src/app/core/services/user.service.service';
import { CourseService } from 'src/app/core/services/course.service';
import { Course } from 'src/app/core/interfaces/course';
import { User } from 'src/app/core/interfaces/user';
import { AuthService } from 'src/app/core/services/auth.service';

@Component({
  selector: 'app-user-details',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './supplier-details.html',
})
export class UserDetailsComponent implements OnInit {
  private _userService: UserService = inject(UserService);
  private _courseService: CourseService = inject(CourseService);
  private _authService: AuthService = inject(AuthService);
  private _route: ActivatedRoute = inject(ActivatedRoute);
  private _router: Router = inject(Router);

  user: User | null = null;
  userCourses: Course[] = [];
  isLoading = true;
  errorMessage: string | null = null;
  currentUserId: number | null = null;
  isOwnProfile = false;

  ngOnInit(): void {
    const userId = this._route.snapshot.paramMap.get('id');
    this.currentUserId = this._userService.getCurrentUserId();

    if (userId) {
      this.loadUserDetails(parseInt(userId));
    } else {
      this.errorMessage = 'Usuario no encontrado';
      this.isLoading = false;
    }
  }

  loadUserDetails(userId: number): void {
    this.isLoading = true;

    // Verificar si es el propio perfil
    this.isOwnProfile = this.currentUserId === userId;

    this._userService.getUserById(userId).subscribe({
      next: (user) => {
        this.user = user;
        this.loadUserCourses(userId);
      },
      error: (err) => {
        this.errorMessage = 'Error al cargar el perfil del usuario';
        this.isLoading = false;
        console.error(err);
      },
    });
  }

  loadUserCourses(userId: number): void {
    //TODO:
    this._courseService.getCoursesByUser(userId).subscribe({
      next: (courses: any) => {
        this.userCourses = courses;
        this.isLoading = false;
      },
      error: (err: any) => {
        console.error('Error al cargar cursos del usuario:', err);
        this.isLoading = false;
      },
    });
  }

  navigateToCourse(courseId: number): void {
    this._router.navigate(['/course-details', courseId]);
  }

  navigateToEditProfile(): void {
    this._router.navigate(['/profile']);
  }

  navigateToBack(): void {
    this._router.navigate(['/home']);
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

  getMemberSinceDate(): string {
    if (!this.user || !this.user.createdAt) return 'fecha desconocida';
    const date = new Date(this.user.createdAt);
    return date.toLocaleDateString('es-ES', { year: 'numeric', month: 'long' });
  }
}
