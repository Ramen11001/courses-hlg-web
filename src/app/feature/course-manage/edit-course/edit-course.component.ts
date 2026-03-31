import { Component } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CourseService } from 'src/app/core/services/course.service';
import { Course } from 'src/app/core/interfaces/course';
import { CommonModule } from '@angular/common';
@Component({
  selector: 'app-edit-course',
  templateUrl: './edit-course.component.html',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
})
export class EditCourseComponent {
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
    //private authService: AuthService,
  ) {
    this.courseForm = this.fb.group({
      title: ['', [Validators.minLength(3)]],
      cost: [0],
      description: ['', Validators.minLength(10)],
    });
    this.courseId = Number(this.route.snapshot.paramMap.get('id'));
  }

  ngOnInit(): void {
    this.loadCourse();
  }
  /**
   * Handles errors by displaying a message and navigating after delay.
   * @private
   * @param {string} message - Error message to display
   */
  private handleError(message: string): void {
    this.errorMessage = message;
    this.isLoading = false;
    setTimeout(() => this.router.navigate(['/edit/:']), 2000);
  }
  // Loads course data from API and checks edit permissions.
  loadCourse(): void {
    this.isLoading = true;
    this.errorMessage = null;

    /**  TODO:
     *  const currentUserId = this.authService.getCurrentUserId();
    if (!currentUserId) {
      this.handleError('Debes iniciar sesión para editar cursos');
      return;
    } */


    this.courseService.getcourseId(this.courseId).subscribe({
      next: (course: Course) => {
        /**  TODO:    if (course.user_id !== currentUserId) {
              this.handleError('No tienes permiso para editar este curso');
              return;
            }
    */
        this.canEdit = true;
        this.courseForm.patchValue({
          name: course.title,
          price: course.cost,
          description: course.description,
        });
        this.isLoading = false;
      },
      error: (err: string) => {
        if (err === 'Curso no encontrado') {
          this.showError('Curso no encontrado');
        } else {
          this.showError('Error al cargar el curso');
        }
      },
    });
  }
  showError(arg0: string) {
    throw new Error('Method not implemented.');
  }

  /**
   * Navigates to the course page.
   * Uses Angular Router to navigate to '/course' route.
   * @returns {void}
   */
  navigateToCourse() {
    this.router.navigate(['/course']);
  }

  /**
   * Handles form submission for course updates.
   */
  onSubmit(): void {
    this.courseForm.markAllAsTouched();

    // Proceed only if form is valid
    if (this.courseForm.valid) {
      this.isLoading = true;
      this.errorMessage = null;

      const formData = {
        ...this.courseForm.value,
        price: Number(this.courseForm.value.price),
        //TODO:    userId: this.authService.getCurrentUserId()!,
      };

      this.courseService.saveCourse(this.courseId, formData).subscribe({
        next: () => {
          this.isLoading = false;

          this.router.navigate(['/course'], {
            state: { message: 'Curso actualizado exitosamente' },
          });
        },
        error: (error) => {
          this.isLoading = false;

          if (error.status === 403) {
            this.errorMessage =
              'No tienes permiso para actualizar este curso';
          } else if (error.status === 404) {
            this.errorMessage = 'Curso no encontrado';
          } else {
            this.errorMessage =
              'Error al actualizar el curso: ' +
              (error.error?.message || error.message);
          }
        },
      });
    }
  }
}
