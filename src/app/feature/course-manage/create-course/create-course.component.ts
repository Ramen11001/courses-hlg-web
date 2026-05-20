import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
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
      init_date: ['', [futureDateValidator()]],
      end_date: ['', [futureDateValidator()]],
      duration_time: [''],
      tagName: [''],
      tagColor: ['primary'],
    }, { validators: endDateAfterInitDateValidator() });

    this.courseForm.get('init_date')?.valueChanges.subscribe(() => this.calculateDuration());
    this.courseForm.get('end_date')?.valueChanges.subscribe(() => this.calculateDuration());
  }

  private calculateDuration(): void {
    const init = this.courseForm.get('init_date')?.value;
    const end = this.courseForm.get('end_date')?.value;
    if (!init || !end) {
      this.courseForm.get('duration_time')?.setValue('', { emitEvent: false });
      return;
    }
    const initDate = new Date(init);
    const endDate = new Date(end);
    initDate.setHours(0, 0, 0, 0);
    endDate.setHours(0, 0, 0, 0);
    const diffMs = endDate.getTime() - initDate.getTime();
    if (diffMs < 0) {
      this.courseForm.get('duration_time')?.setValue('', { emitEvent: false });
      return;
    }
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays === 0) {
      this.courseForm.get('duration_time')?.setValue('', { emitEvent: false });
      return;
    }
    const weeks = Math.floor(diffDays / 7);
    const days = diffDays % 7;
    let result = '';
    if (weeks > 0) result += `${weeks} ${weeks === 1 ? 'semana' : 'semanas'}`;
    if (days > 0) {
      if (result) result += ', ';
      result += `${days} ${days === 1 ? 'día' : 'días'}`;
    }
    if (!result) result = `${diffDays} días`;
    this.courseForm.get('duration_time')?.setValue(result, { emitEvent: false });
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

function futureDateValidator(): (control: AbstractControl) => ValidationErrors | null {
  return (control: AbstractControl): ValidationErrors | null => {
    if (!control.value) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const inputDate = new Date(control.value);
    inputDate.setHours(0, 0, 0, 0);
    return inputDate < today ? { futureDate: true } : null;
  };
}

function endDateAfterInitDateValidator(): (group: AbstractControl) => ValidationErrors | null {
  return (group: AbstractControl): ValidationErrors | null => {
    const initDate = group.get('init_date')?.value;
    const endDate = group.get('end_date')?.value;
    if (!initDate || !endDate) return null;
    const init = new Date(initDate);
    const end = new Date(endDate);
    init.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);
    return end < init ? { endBeforeInit: true } : null;
  };
}
