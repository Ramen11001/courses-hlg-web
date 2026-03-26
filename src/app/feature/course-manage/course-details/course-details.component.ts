import { CommonModule } from "@angular/common";
import { Component, inject, OnInit } from "@angular/core";
import { ReactiveFormsModule, FormGroup, FormBuilder, Validators } from "@angular/forms";
import { ActivatedRoute, Router } from "@angular/router";
import { Course } from "src/app/core/interfaces/course";
import { User } from "src/app/core/interfaces/user";
import { CourseService } from "src/app/core/services/course.service";


@Component({
  selector: 'app-course-details',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './course-details.component.html',
})
export class CoursesDetailsComponent implements OnInit {
  course: Course | null = null;
  user: User[] = [];
  isLoading = true;
  error: string | null = null;
  formValue: any;
  currentUserId: number | null = null;

  courseService: CourseService = inject(CourseService);
  // TODO: authService: AuthService = inject(AuthService);
  constructor(
    private route: ActivatedRoute,
    private fb: FormBuilder,
    private router: Router,
  ) {
  }

  ngOnInit(): void {
    /**
     * TODO:
    const course_id = this.route.snapshot.paramMap.get('id');
    this.currentUserId = this.authService.getCurrentUserId();
    if (course_id) {
      this.loadProduct(parseInt(course_id));
    } else {
      this.error = 'Curso no encontrado';
      this.isLoading = false;
    }
      */
  }

  /**
   * Loads product details by ID.
   * 
   * @param {number} id - Product ID to load
   */
  loadCourse(id: number): void {
    this.isLoading = true;

    this.courseService.getcourseId(id).subscribe({
      next: (course) => {
        this.course = course;
      },
      error: (err) => {
        this.error = 'Error al cargar el curso';
        this.isLoading = false;
        console.error(err);
      },
    });
  }

  /**
   * Checks if user is authenticated.
   * @returns {boolean} Authentication status
  get isAuthenticated(): boolean {
    return this.authService.isAuthenticated();
  }
  */

  /**
   * Navigates to the course page.
   * 
   * @returns {void}
   */
  navigateToCourse() {
    this.router.navigate(['/course']);
  }
}
