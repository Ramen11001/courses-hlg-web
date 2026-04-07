import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Course } from 'src/app/core/interfaces/course';
import { User } from 'src/app/core/interfaces/user';
import { AuthService } from 'src/app/core/services/auth.service';
import { CommentsService } from 'src/app/core/services/comment.service';
import { CourseService } from 'src/app/core/services/course.service';
import { Comment } from 'src/app/core/interfaces/comment';

@Component({
  selector: 'app-course-details',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './course-details.component.html',
})
export class CoursesDetailsComponent implements OnInit {
  _authService: AuthService = inject(AuthService);
  _commentService: CommentsService = inject(CommentsService);
  _courseService: CourseService = inject(CourseService);

  course: Course | null = null;
  comments: Comment[] = [];
  commentForm: FormGroup;
  user: User[] = [];
  isLoading = true;
  error: string | null = null;
  formValue: any;
  currentUserId: number | null = null;

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
    const course_id = this.route.snapshot.paramMap.get('id');
    this.currentUserId = this._authService.getCurrentUserId();
    if (course_id) {
      this.loadCourse(parseInt(course_id));
    } else {
      this.error = 'Curso no encontrado';
      this.isLoading = false;
    }
  }

  /**
   * Loads course details by ID.
   *
   * @param {number} id - course ID to load
   */
  loadCourse(id: number): void {
    this.isLoading = true;

    this._courseService.getcourseId(id).subscribe({
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
        if (!comment.User) {
          comment.User = {
            id: this.currentUserId!,
            fristName:
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

  /**
   * Navigates to the home page.
   * Uses Angular Router to navigate to '/home' route.
   * @returns {void}
   */
  navigateToHome() {
    this.router.navigate(['/home']);
  }
}
