import { Component, inject } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CourseService } from '../../../core/services/course.service';
import { Course } from '../../../core/interfaces/course';
import { CommonModule } from '@angular/common';
import { UserService } from '../../../core/services/user.service.service';

@Component({
  selector: 'app-edit-course',
  templateUrl: './edit-course.component.html',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
})
export class EditCourseComponent {
  private _userService: UserService = inject(UserService);

  courseForm: FormGroup;
  isLoading = false;
  courseId: number;
  errorMessage: string | null = null;
  canEdit = false;
  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private courseService: CourseService,
  ) {
    this.courseForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(3)]],
      cost: [0, [Validators.min(0)]],
      description: ['', [Validators.required]],
      study_plan: ['', [Validators.required]],
      location: ['', [Validators.required]],
    });
    this.courseId = Number(this.route.snapshot.paramMap.get('id'));
  }

  ngOnInit(): void {
    this.loadCourse();
  }
  // Loads course data from API and checks edit permissions.
  loadCourse(): void {
    this.isLoading = true;
    this.errorMessage = null;

    const currentUserId = this._userService.getCurrentUserId();
    if (!currentUserId) {
      this.showError('Debes iniciar sesión para editar cursos');
      return;
    }

    this.courseService.getcourseId(this.courseId).subscribe({
      next: (course: Course) => {
        if (course.user_id !== currentUserId) {
          this.showError('No tienes permiso para editar este curso');
          this.navigateToCourse();
          return;
        }

        this.canEdit = true;
        this.courseForm.patchValue({
          title: course.title,
          cost: course.cost,
          description: course.description,
          study_plan: course.study_plan,
          location: course.location,
        });
        this.isLoading = false;
      },
      error: (err: any) => {
        if (err === 'Curso no encontrado') {
          this.showError('Curso no encontrado');
        } else {
          this.showError('Error al cargar el curso');
        }
      },
    });
  }
  showError(message: string): void {
    this.errorMessage = message;
    this.isLoading = false;
    setTimeout(() => this.router.navigate(['/home']), 2000);
  }

  /**
   * Navigates to the course page.
   * Uses Angular Router to navigate to '/course' route.
   * @returns {void}
   */
  navigateToCourse() {
    this.router.navigate(['/home']);
  }

  /**
   * Handles form submission for course updates.
   */
  onSubmit(): void {
    this.courseForm.markAllAsTouched();

    if (this.courseForm.valid) {
      this.isLoading = true;
      this.errorMessage = null;

      const formData = {
        ...this.courseForm.value,
        cost: Number(this.courseForm.value.cost),
        userId: this._userService.getCurrentUserId()!,
      };

      this.courseService.saveCourse(this.courseId, formData).subscribe({
        next: () => {
          this.isLoading = false;
          this.router.navigate(['/home'], {
            state: { message: 'Curso actualizado exitosamente' },
          });
        },
        error: (error) => {
          this.isLoading = false;

          if (error.status === 403) {
            this.errorMessage = 'No tienes permiso para actualizar este curso';
          } else if (error.status === 404) {
            this.errorMessage = 'Curso no encontrado';
          } else {
            this.errorMessage =
              'Error al actualizar el curso: ' +
              (error.error?.message || error.message);
          }

          setTimeout(() => {
            if (this.errorMessage) this.errorMessage = null;
          }, 3000);
        },
      });
    }
  }
}
