import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Course } from '../../../core/interfaces/course';
import { User } from '../../../core/interfaces/user';
import { AuthService } from '../../../core/services/auth.service';
import { CommentsService } from '../../../core/services/comment.service';
import { CourseService } from '../../../core/services/course.service';
import { Comment } from '../../../core/interfaces/comment';
import { UserService } from '../../../core/services/user.service.service';
import { Enrollment } from '../../../core/interfaces/enrollment';
import { EnrollmentService } from '../../../core/services/enrollment.service';

@Component({
  selector: 'app-supplier-course-details',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './supplier-details.component.html',
})
export class CoursesDetailsComponent implements OnInit {
  private _authService: AuthService = inject(AuthService);
  private _commentService: CommentsService = inject(CommentsService);
  private _courseService: CourseService = inject(CourseService);
  private _userService: UserService = inject(UserService);
  private _enrollmentService: EnrollmentService = inject(EnrollmentService);
  private _cdr: ChangeDetectorRef = inject(ChangeDetectorRef);

  course: Course | null = null;
  comments: Comment[] = [];
  commentForm: FormGroup;
  user: User[] = [];
  users: User | null = null;;
  isLoading = true;
  error: string | null = null;
  formValue: any;
  currentUserId: number | null = null;
  tags: { name: string; color: string }[] = [];
  durations: { init_date: string; end_date: string; duration_time: string }[] =
    [];
  isEnrolled: boolean = false;
  enrollment: Enrollment | null = null;
  isEnrolling: boolean = false;
  successMessage: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private fb: FormBuilder,
    private router: Router,
  ) {
    /**
     * Initializes the comment form with validation rules:
     * - Text: Required, minimum 3 characters
     * - Rating: Required, between 1-5 stars
     */
    this.commentForm = this.fb.group({
      text: ['', [Validators.required, Validators.minLength(3)]],
      rating: [5, [Validators.required, Validators.min(1), Validators.max(5)]],
    });
  }

  ngOnInit(): void {
    const user_id = this.route.snapshot.paramMap.get('id');
    this.currentUserId = this._userService.getCurrentUserId();
    if (user_id) {
      this.loadUser(parseInt(user_id));
    } else {
      this.error = 'Usuario no encontrado';
      this.isLoading = false;
    }
  }

  /**
   * Loads comment course  by ID.
   *
   * @param {number} id - course ID to load
   */
  loadComments(id: number): void {
    this._commentService.getCommentsByUser(id).subscribe({
      next: (comments) => {
        this.comments = comments;
        this.isLoading = false;
      },
      error: (err) => {
        this.error = 'Error al cargar los comentarios';
        this.isLoading = false;
        console.error(err);
      },
    });
  }

  /**
   * Loads course details by ID.
   *
   * @param {number} id - course ID to load
   */
  loadUser(id: number): void {
    this.isLoading = true;
    this._userService.getUserById(id).subscribe({
      next: (user) => {
        this.users = user;
        this.loadComments(id);
      },
      error: (err) => {
        this.error = 'Error al cargar el Usuario';
        this.isLoading = false;
        console.error(err);
      },
    });
  }
  /**
   * Handles comment form submission.
   * - Validates form and authentication
   * - Creates new comment via service
   * - Resets form on success
   */
  onSubmit(): void {
    if (this.commentForm.invalid || !this.course) return;

    if (!this._authService.isAuthenticated()) {
      this.router.navigate(['/home']);
      return;
    }

    const commentData = {
      text: this.commentForm.value.text,
      rating: Number(this.commentForm.value.rating),
      course_id: this.course.id,
    };

    this._commentService.createComment(null, commentData).subscribe({
      next: (comment) => {
        if (!comment.user) {
          comment.user = {
            id: this.currentUserId!,
            firstName:
              this._authService.getCurrentUserName() || 'Usuario actual',
          };
        }

        this.comments.unshift(comment);
        this.commentForm.reset({ text: '', rating: 5 });
      },
      error: (err) => {
        this.error = 'Error al enviar el comentario';
        console.error(err);
      },
    });
  }

  /**
   * Check if current user is enrolled in this course
   */
  checkEnrollmentStatus(courseId: number): void {
    if (!this._authService.isAuthenticated()) return;

    this._enrollmentService.isEnrolled(courseId).subscribe({
      next: (enrolled) => {
        this.isEnrolled = enrolled;
      },
      error: (err) => {
        console.error('Error checking enrollment:', err);
      },
    });
  }

  /**
   * Enroll in current course
   */
  enrollInCourse(): void {
    if (!this._authService.isAuthenticated()) {
      this.router.navigate(['/login']);
      return;
    }

    if (!this.course) return;

    this.isEnrolling = true;

    this._enrollmentService.enrollInCourse(this.course.id).subscribe({
      next: (enrollment) => {
        this.enrollment = enrollment;
        this.isEnrolled = true;
        this.isEnrolling = false;
        this.showSuccessMessage('¡Te has inscrito exitosamente al curso!');
      },
      error: (err) => {
        this.isEnrolling = false;
        this.error = err.message || 'Error al inscribirse en el curso';
        console.error(err);
      },
    });
  }

  /**
   * Cancel enrollment
   */
  cancelEnrollment(): void {
    if (!this.enrollment) return;

    if (confirm('¿Estás seguro de que deseas cancelar tu inscripción?')) {
      this._enrollmentService.cancelEnrollment(this.enrollment.id).subscribe({
        next: () => {
          this.isEnrolled = false;
          this.enrollment = null;
          this.showSuccessMessage('Has cancelado tu inscripción');
        },
        error: (err) => {
          this.error = err.message || 'Error al cancelar la inscripción';
          console.error(err);
        },
      });
    }
  }

  showSuccessMessage(message: string): void {
    this.successMessage = message;
    setTimeout(() => {
      this.successMessage = null;
    }, 3000);
  }

  /**
   * Checks if user is authenticated.
   * @returns {boolean} Authentication status
   */
  get isAuthenticated(): boolean {
    return this._authService.isAuthenticated();
  }
  /**
   * Deletes a comment by ID.
   * - Validates comment ID
   * - Updates comments list after successful deletion
   *
   * @param {number} commentId - ID of the comment to delete
   */
  deleteComment(commentId: number): void {
    if (!commentId) {
      console.error('ID de comentario no válido');
      return;
    }

    this._commentService.deleteComment(commentId).subscribe({
      next: () => {
        this.comments = this.comments.filter((c) => c.id !== commentId);
      },
      error: (err) => {
        console.error('Error al eliminar comentario:', err);
      },
    });
  }

  //get use information
  getUserInitials(firstName?: string, lastName?: string): string {
    if (firstName && lastName) {
      return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
    }
    if (firstName) {
      return firstName.charAt(0).toUpperCase();
    }
    return 'U';
  }

  /**
   * Navigates to the home page.
   * Uses Angular Router to navigate to '/porfile' route.
   * @returns {void}
   */
  navigateToHome() {
     const id = this._userService.getCurrentUserId();
    if (id) {
      this.router.navigate(['/home']);
    }
    
  }
}
