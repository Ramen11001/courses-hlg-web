import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CourseService } from '../../../core/services/course.service';
import { AuthService } from '../../../core/services/auth.service';
import { UserService } from '../../../core/services/user.service.service';

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
  imageFiles: File[] = [];
  imagePreviews: string[] = [];

  constructor(private fb: FormBuilder) {
    this.courseForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(200)]],
      cost: [null, [Validators.required, Validators.min(0)]],
      area: ['', Validators.required],
      mode: ['', Validators.required],
      level: ['', Validators.required],
      certificate: [false, Validators.required],
      description: ['', [Validators.required, Validators.minLength(20), Validators.maxLength(1000)]],
      study_plan: ['', [Validators.maxLength(5000)]],
      location: ['', [Validators.required, Validators.maxLength(200)]],
      init_date: [''],
      end_date: [''],
      duration_time: [''],
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

  onImagesSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      const newFiles = Array.from(input.files);
      this.imageFiles = [...this.imageFiles, ...newFiles];
      newFiles.forEach((file) => {
        this.imagePreviews.push(URL.createObjectURL(file));
      });
    }
  }

  removeImage(index: number): void {
    URL.revokeObjectURL(this.imagePreviews[index]);
    this.imageFiles.splice(index, 1);
    this.imagePreviews.splice(index, 1);
  }

  private fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  async onSubmit() {
    this.courseForm.markAllAsTouched();

    if (this.courseForm.valid) {
      this.isLoading = true;
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

      const images: string[] = [];
      if (this.imageFiles.length > 0) {
        try {
          for (const file of this.imageFiles) {
            const base64 = await this.fileToBase64(file);
            images.push(base64);
          }
        } catch (err) {
          console.error('Error reading images:', err);
        }
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
        images,
        user_id: this._userService.getCurrentUserId(),
      };

      this._courseService.saveCourse(null, formData).subscribe({
        next: () => {
          this.isLoading = false;
          console.info('Curso añadido correctamente');
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
