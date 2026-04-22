import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CourseService } from 'src/app/core/services/course.service';
import { AuthService } from 'src/app/core/services/auth.service';
import { UserService } from 'src/app/core/services/user.service.service';

@Component({
  selector: 'app-create-course',
  standalone: true,
  templateUrl: './create-course.component.html',
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
})
export class CreateCourseComponent {
  private _userService = inject(UserService);
  private _courseService = inject(CourseService);
  private _router = inject(Router);

  courseForm: FormGroup;
  isLoading = false;
  tags: { name: string; color: string }[] = [];

  constructor(private fb: FormBuilder) {
    this.courseForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(3)]],
      cost: [null, [Validators.required, Validators.min(0)]],
      area: ['', Validators.required],
      mode: ['', Validators.required],
      level: ['', Validators.required],
      certificate: [false, Validators.required],
      description: ['', [Validators.minLength(10)]],
      study_plan: ['', [Validators.minLength(10)]],
      location: ['', [Validators.maxLength(200)]],
      // Duration fields
      init_date: [''],
      end_date: [''],
      duration_time: [''],
      // Tags fields
      tagName: [''],
      tagColor: ['primary'],
    });
  }

  navigateToHome() {
    this._router.navigate(['/home']);
  }

  addTag(): void {
    const tagName = this.courseForm.get('tagName')?.value;
    const tagColor = this.courseForm.get('tagColor')?.value;

    if (tagName && tagName.trim()) {
      this.tags.push({ name: tagName.trim(), color: tagColor || 'primary' });
      this.courseForm.get('tagName')?.reset();
      this.courseForm.patchValue({ tags: this.tags });
    }
  }

  removeTag(index: number): void {
    this.tags.splice(index, 1);
    this.courseForm.patchValue({ tags: this.tags });
  }

  onSubmit() {
    this.courseForm.markAllAsTouched();

    if (this.courseForm.valid) {
      this.isLoading = true;

      //TODO:
      const duration = [];
      if (
        this.courseForm.value.init_date ||
        this.courseForm.value.end_date ||
        this.courseForm.value.duration_time
      ) {
        duration.push({
          init_date: this.courseForm.value.init_date,
          end_date: this.courseForm.value.end_date,
          duration_time: this.courseForm.value.duration_time,
        });
      }

      const formData = {
        title: this.courseForm.value.title,
        cost: Number(this.courseForm.value.cost),
        area: this.courseForm.value.area,
        mode: this.courseForm.value.mode,
        level: this.courseForm.value.level,
        certificate: this.courseForm.value.certificate,
        description: this.courseForm.value.description,
        study_plan: this.courseForm.value.study_plan,
        location: this.courseForm.value.location,
        duration: duration,
        tags: this.tags,
        user_id: this._userService.getCurrentUserId,
      };

      this._courseService.saveCourse(null, formData).subscribe({
        next: () => {
          this.isLoading = false;
          console.info("Curso añadido correctamente")
          this._router.navigate(['/home']);
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
