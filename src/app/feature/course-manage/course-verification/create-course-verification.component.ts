import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import {
  ReactiveFormsModule,
  FormsModule,
  FormGroup,
  FormBuilder,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';
import { UserService } from 'src/app/core/services/user.service.service';

@Component({
  selector: 'app-create-course',
  standalone: true,
  templateUrl: './create-course-verification.component.html',
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
})
export class CreateCourseComponent {
  private _router = inject(Router);
  private _userService = inject(UserService);

  courseVerifiationForm: FormGroup;
  isLoading = false;

  //User Form
  constructor(private fb: FormBuilder) {
    this.courseVerifiationForm = this.fb.group({
      user: ['', [Validators.required, Validators.minLength(3)]],
      finishedcourses: [false, Validators.required],
      certificate: [false, Validators.required],
      location: [false, Validators.required],
    });
  }

  navigateToHome() {
    this._router.navigate(['/home']);
  }

  onSubmit() {
    this.courseVerifiationForm.markAllAsTouched();

    if (this.courseVerifiationForm.valid) {
      this.isLoading = true;

      const formData = {
        user: this.courseVerifiationForm.value.user,
        finishedourses: this.courseVerifiationForm.value.finishedourses,
        certificate: this.courseVerifiationForm.value.certificate,
        rating: this.courseVerifiationForm.value.rating,
        user_id: this._userService.getCurrentUserId,
      };

      if (formData) {
        if (formData.certificate === false) {
          console.error(
            'Debe ofrecer certificaciones en su curso para ser una entidad verificada',
          );
        } else if (formData.certificate === false) {
          console.error(
            'Debe tener cursos terminados para ser una entidad verificada',
          );
        }
      }
    }
  }
}
