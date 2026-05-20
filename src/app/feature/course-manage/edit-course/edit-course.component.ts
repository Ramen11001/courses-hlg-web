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
  imageFiles: File[] = [];
  imagePreviews: string[] = [];
  existingImages: string[] = [];
  removedExisting: boolean[] = [];

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

        const imgs = (course as any).images;
        if (Array.isArray(imgs) && imgs.length > 0) {
          this.existingImages = imgs;
          this.removedExisting = imgs.map(() => false);
        } else if (typeof imgs === 'string') {
          try {
            const parsed = JSON.parse(imgs);
            if (Array.isArray(parsed)) {
              this.existingImages = parsed;
              this.removedExisting = parsed.map(() => false);
            }
          } catch {}
        }

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

  removeNewImage(index: number): void {
    URL.revokeObjectURL(this.imagePreviews[index]);
    this.imageFiles.splice(index, 1);
    this.imagePreviews.splice(index, 1);
  }

  removeExistingImage(index: number): void {
    this.removedExisting[index] = true;
  }

  restoreExistingImage(index: number): void {
    this.removedExisting[index] = false;
  }

  private fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  get imageCount(): number {
    const kept = this.existingImages.filter((_, i) => !this.removedExisting[i]).length;
    return kept + this.imageFiles.length;
  }

  /**
   * Handles form submission for course updates.
   */
  async onSubmit() {
    this.courseForm.markAllAsTouched();

    if (this.courseForm.valid) {
      this.isLoading = true;
      this.errorMessage = null;

      const images: string[] = [];

      this.existingImages.forEach((img, i) => {
        if (!this.removedExisting[i]) {
          images.push(img);
        }
      });

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
        ...this.courseForm.value,
        cost: Number(this.courseForm.value.cost),
        images,
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
