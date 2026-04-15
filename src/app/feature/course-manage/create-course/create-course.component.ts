import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CourseService } from 'src/app/core/services/course.service';
/**
 * Component for creating new course.
 * Provides a form to input course details and handles submission to the API.
 *
 * @component
 * @selector app-create-course
 * @standalone true
 */
@Component({
  selector: 'app-create-course',
  standalone: true,
  templateUrl: './create-course.component.html',
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
})
export class CreateCourseComponent {
  /**
   * Form group for coure creation.
   * @type {FormGroup}
   */
  courseForm: FormGroup;
  /**
   * Loading state indicator.
   * @type {boolean}
   */
  isLoading = false;
  /**
   * Component constructor.
   * Initializes the course form with validation rules.
   *
   * @param {FormBuilder} fb - Angular form builder service
   * @param {Router} router - Angular router for navigation
   * @param {CourseService} courseService - course API service
   */
  constructor(
    private fb: FormBuilder,
    private router: Router,
    private courseService: CourseService,
  ) {
    // Initialize form with validation rules
    this.courseForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      cost: [null, [Validators.required, Validators.min(0)]],
      description: ['', Validators.minLength(20)],
      study_plan: ['', Validators.minLength(10)],
      location: ['', Validators.minLength(10)],
      //TODO: certificate, area, mode, level,
    });
  }

  /**
   * Navigates to the course page.
   * Uses Angular Router to navigate to '/home' route.
   * @returns {void}
   */
  navigateToHome() {
    this.router.navigate(['/home']);
  }

  /**
   * Handles form submission.
   * - Validates form inputs
   * - Converts cost to number
   * - Calls course service to save new course
   * - Navigates to course list on success
   * - Shows error alerts on failure
   *
   * @returns {void}
   */
  onSubmit() {
    // Trigger validation UI for all fields
    this.courseForm.markAllAsTouched();

    if (this.courseForm.valid) {
      this.isLoading = true;

      // Convert cost to number type for API
      const formData = {
        ...this.courseForm.value,
        cost: Number(this.courseForm.value.cost),
      };
      // Call course service to create new course
      this.courseService.saveCourse(null, formData).subscribe({
        next: (response) => {
          this.isLoading = false;
          // Navigate to course list after successful creation
          this.router.navigate(['/course']);
        },
        error: (error) => {
          this.isLoading = false;
          console.error('Error:', error);
          alert(
            'Error al crear curso: ' + (error.error?.message || error.message),
          );
        },
      });
    }
  }
}
