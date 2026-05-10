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
import { CourseCardComponent } from '../../../shared/cards/course-card/course-card.component';
import { ImageCarouselComponent } from '../../../shared/components/image-carousel/image-carousel.component';

@Component({
  selector: 'app-supplier-course-details',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, CourseCardComponent, ImageCarouselComponent],
  templateUrl: './supplier-details.component.html',
})
export class UserDetailsComponent implements OnInit {
  private _authService: AuthService = inject(AuthService);
  private _commentService: CommentsService = inject(CommentsService);
  private _courseService: CourseService = inject(CourseService);
  private _userService: UserService = inject(UserService);
  private _cdr: ChangeDetectorRef = inject(ChangeDetectorRef);

  users: User | null = null;
  userCourses: Course[] = [];
  comments: Comment[] = [];
  isLoading = true;
  error: string | null = null;
  currentUserId: number | null = null;
  currentUserRole: string | null = null;
  commentForm: FormGroup;
  isSubmitting = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private fb: FormBuilder,
  ) {
    this.currentUserId = this._userService.getCurrentUserId();
    this.currentUserRole = this._userService.getCurrentUser()?.role || null;
    this.commentForm = this.fb.group({
      text: ['', [Validators.required, Validators.minLength(3)]],
      rating: [5, [Validators.required, Validators.min(1), Validators.max(5)]],
    });
  }

  ngOnInit(): void {
    const userIdStr = this.route.snapshot.paramMap.get('id');
    if (userIdStr) {
      const userId = parseInt(userIdStr, 10);
      this.loadUser(userId);
    } else {
      this.error = 'Usuario no encontrado';
      this.isLoading = false;
    }
  }

  loadUser(userId: number): void {
    this.isLoading = true;
    this._userService.getUserById(userId).subscribe({
      next: (user) => {
        this.users = user;
        if (user.role === 'COURSE_SUPPLIER') {
          this.loadUserCourses(userId);
        }
        if (this.shouldShowComments(user)) {
          this.loadUserComments(userId);
        } else {
          this.isLoading = false;
        }
        this._cdr.detectChanges();
      },
      error: (err) => {
        this.error = 'Error al cargar el usuario';
        this.isLoading = false;
        console.error(err);
      },
    });
  }

  private shouldShowComments(user: User): boolean {
    if (!this.currentUserId) return false;
    if (user.id === this.currentUserId) return false;
    if (this.currentUserRole === 'USER') return false;
    if (user.role === 'USER') return false;
    return true;
  }

  loadUserCourses(userId: number): void {
    this._courseService.allCourses().subscribe({
      next: (courses) => {
        this.userCourses = courses.filter((c) => c.user_id === userId);
        this._cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error al cargar cursos:', err);
      },
    });
  }

  loadUserComments(userId: number): void {
    this._commentService.getCommentsByUser(userId).subscribe({
      next: (comments) => {
        this.comments = comments;
        this.isLoading = false;
        this._cdr.detectChanges();
      },
      error: (err) => {
        this.error = 'Error al cargar los comentarios';
        this.isLoading = false;
        console.error(err);
      },
    });
  }

  get isCurrentUser(): boolean {
    return this.currentUserId === this.users?.id;
  }

  get isAdmin(): boolean {
    return this.currentUserRole === 'ADMIN';
  }

  get showComments(): boolean {
    return !this.isCurrentUser;
  }

  get isStudent(): boolean {
    return this.currentUserRole === 'USER';
  }

  

  getInitials(): string {
    if (!this.users?.firstName || !this.users?.lastName) return 'U';
    return (this.users.firstName[0] + this.users.lastName[0]).toUpperCase();
  }

  getUserImages(): string[] {
    if (!this.users) return [];
    const imgs = (this.users as any).images;
    if (!imgs) return [];
    if (Array.isArray(imgs) && imgs.length > 0) return imgs;
    if (typeof imgs === 'string') {
      try {
        const parsed = JSON.parse(imgs);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    }
    return [];
  }

  getCommentUserInitials(user?: User): string {
    if (!user?.firstName || !user?.lastName) return 'U';
    return (user.firstName[0] + user.lastName[0]).toUpperCase();
  }

  navigateToHome(): void {
    this.router.navigate(['/home']);
  }

  navigateToCourseDetails(courseId: number): void {
    this.router.navigate(['/courseDetails/' + courseId]);
  }

  navigateToEditCourse(courseId: number): void {
    this.router.navigate(['/edit/' + courseId]);
  }

  openDeleteModal(course: Course): void {}

  submitComment(): void {
    if (this.commentForm.invalid || !this.users?.id || this.isSubmitting)
      return;
    if (!this._authService.isAuthenticated()) {
      this.router.navigate(['/login']);
      return;
    }

    this.isSubmitting = true;
    const commentData = {
      text: this.commentForm.value.text,
      rating: Number(this.commentForm.value.rating),
    };

    this._commentService
      .createCommentForUser(this.users.id, commentData)
      .subscribe({
        next: (comment) => {
          const currentUser = this._userService.getCurrentUser();
          if (comment) {
            comment.user = currentUser
              ? {
                  id: currentUser.id,
                  firstName: currentUser.firstName,
                  lastName: currentUser.lastName,
                }
              : undefined;
          }
          this.comments.unshift(comment);
          this.commentForm.reset({ text: '', rating: 5 });
          this.isSubmitting = false;
          this._cdr.detectChanges();
        },
        error: (err) => {
          this.error = 'Error al enviar el comentario';
          this.isSubmitting = false;
          console.error(err);
        },
      });
  }
}
