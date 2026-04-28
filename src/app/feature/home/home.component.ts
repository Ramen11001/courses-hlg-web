import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import {
  FormsModule,
  ReactiveFormsModule,
  FormGroup,
  FormControl,
  FormBuilder,
} from '@angular/forms';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';
import { Course } from '../../core/interfaces/course';
import { User } from '../../core/interfaces/user';
import { AuthService } from '../../core/services/auth.service';
import { CourseService } from '../../core/services/course.service';
import { UserService } from '../../core/services/user.service.service';
import { CourseCardComponent } from '../../shared/cards/course-card/course-card.component';
import { UserCardComponent } from '../../shared/cards/user-card/user-card.component';

@Component({
  selector: 'app-home',
  standalone: true,
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
  imports: [CommonModule, FormsModule, ReactiveFormsModule, CourseCardComponent, UserCardComponent],
})
export class HomeComponent implements OnInit {
  private _authService: AuthService = inject(AuthService);
  private _userService: UserService = inject(UserService);
  private _courseService: CourseService = inject(CourseService);
  private _router: Router = inject(Router);
  private _cdr: ChangeDetectorRef = inject(ChangeDetectorRef);

  users: User | null = null;
  user: User[] = [];
  username = this._authService.getCurrentUserName();
  course: Course[] = [];
  comments: Comment[] = [];
  filterName: string = '';
  minPrice: number | null = null;
  maxPrice: number | null = null;
  currentPage: number = 1;
  itemsPerPage: number = 12;
  hasMore = false;
  currentUserId: number | null = null;
  isLoading: boolean = true;
  id = this._userService.getCurrentUserId();
  popularCourses: Course[] = [];

  //Role
  cantCreate: boolean = false;
  selectedCourse: Course | null = null;

  //Reactive Form
  filterForm: FormGroup = new FormGroup({
    filterName: new FormControl(''),
    minPrice: new FormControl(null),
    maxPrice: new FormControl(null),
  });

  //TODO: Merge Develo
  ngOnInit() {
    const token = this._authService.getToken();
    if (!token) {
      this._router.navigate(['/login']);
    } else {
      this.rolePermisson();
      this.id;
      this.getCourse();
      //TODO: Está bien horrendo el loadUSer()
      this.loadAllUsers();

      this.filterForm.valueChanges.subscribe((_values) => {
        this.currentPage = 1;
        this.getCourse();
      });
    }
  }

  //region GET AND LOAD
  //Retrieves courses from the backend using search filters and pagination.
  getCourse(): void {
    this.isLoading = true;
    const { filterName, minPrice, maxPrice } = this.filterForm.value;
    this._courseService
      .getCourses(
        filterName,
        minPrice,
        maxPrice,
        this.currentPage,
        this.itemsPerPage,
      )
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe({
        next: (response: Course[]) => {
          this.popularCourses = [];
          this.course = response.map((course: Course) => {
            const ratings =
              course.comments?.map((comment) => comment.rating) || [];

            const averageRating =
              ratings.length > 0
                ? ratings.reduce(
                  (sum: number, rating: number) => sum + rating,
                  0,
                ) / ratings.length
                : 0;

            const courseWithRating = { ...course, averageRating };

            if (averageRating > 3) {
              this.popularCourses.push(courseWithRating);
            }

            return courseWithRating;
          });
          // If the number of courses equals the items per page, assume that more comments are available.
          this.hasMore = this.course.length === this.itemsPerPage;
        },
        error: (error) => {
          console.error('Error al obtener cursos:', error);
        },
      });
  }

  loadAllUsers(): void {
    this.isLoading = true;
    this._userService.allUsers().subscribe({
      next: (users) => {
        this.user = users;
        this.user = users.filter((user) => user.id !== this.id);
        this.user = users.filter(
          (user) =>
            user.firstName !== 'Administrador' ||
            user.lastName !== 'Administrador',
        );
        this.isLoading = false;
        this._cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error al cargar usuarios:', error);
        this.isLoading = false;
      },
    });
  }

  //region changePage

  /**
   * Handles pagination by updating the current page and fetching course for the new page.
   *
   * @function
   * @param {number} newPage - The page number to navigate to.
   */
  changePage(newPage: number): void {
    if (newPage < 1) return;
    this.currentPage = newPage;
    this.getCourse();
  }
  /**
   * Advances to the next page if more course are available.
   *
   * @function
   */
  nextPage(): void {
    if (this.hasMore) {
      this.changePage(this.currentPage + 1);
    }
  }
  /**
   * Returns to the previous page if currently beyond the first page.
   *
   * @function
   */
  prevPage(): void {
    if (this.currentPage > 1) {
      this.changePage(this.currentPage - 1);
    }
  }

  //TODO: Hacer una métrica para calcular cursos populares
  popularsCoursesFilter() {
    this.course.forEach((courseComments) => {
      //    if (courseComments.comments?.length>=8) {
      //       this.popularCourses.push(courseComments.title)
      //    }
    });
  }

  //region DELETE
  /**
   * Deletes a courses by ID and updates local course list.
   *
   * @param {number} id - ID of the course to delete
   */
  deleteCourse(id: number): void {
    if (!id) return;

    this._courseService.deleteCourse(id).subscribe({
      next: () => {
        // Update local course array by filtering out deleted course
        this.course = this.course.filter((course_id) => course_id.id !== id);
        this.getCourse();
      },
      error: (err: any) => {
        console.error('Error deleting course:', err);
        // TODO: Implementar un toastSevice
      },
    });
  }

  openDeleteModal(course: Course): void {
    this.selectedCourse = course;
  }

  //region ROLE PERMISSION:
  rolePermisson() {
    const user_id = this._userService.getCurrentUserId()!;
    const user = this._userService.getUserById(user_id);
    user.forEach((is_curse_supplier) => {
      const role = is_curse_supplier.role;
      if (role === 'COURSE_SUPPLIER') {
        this.cantCreate = true;
        this._cdr.detectChanges();
      }
    });
  }

  //region ICON:
  getInitials(): string {
    if (!this.users) return 'U';
    const firstName = this.users.firstName || '';
    const lastName = this.users.lastName || '';
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  }

  // region NAVIGATE:
  // Navigates to the course details page.
  navigateToDetailsCourse(id: number): void {
    this._router.navigate(['/courseDetails/' + id]);
  }

  navigateToDetailsUser(id: number): void {
    this._router.navigate(['/userDetails/' + id]);
  }

  // Navigates to the course creation page.
  navigateToCreateCourse(): void {
    this._router.navigate(['/createCourse']);
  }

  // Navigates to the course editing page for a specific course.

  navigateToEditCourse(id: number): void {
    this._router.navigate(['edit/' + id]);
  }

  goToMyProfile() {
    const id = this._userService.getCurrentUserId();
    if (id) {
      this._router.navigate(['/user', id]);
    }
  }
  navigateToLogout(): void {
    this._authService.logout();
  }

  //region ONSUBMIT
  /**
       * Handles form submission.
       * - Call logout function for  logs out the user by removing the stored token
       * - if it is correct it presents the elements,
       * - if not, it returns to the login and does not let you enter /course
       
       *
       * @function
       */
  onsubmit() {
    this._authService.logout();
    this.course = [];
    this.username = '';
    this.isLoading = false;
    this._router.navigate(['/login']);
  }
}
