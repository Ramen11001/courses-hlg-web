import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import {
  FormsModule,
  ReactiveFormsModule,
  FormGroup,
  FormControl,
} from '@angular/forms';
import { Route, Router, ɵEmptyOutletComponent } from '@angular/router';
import { finalize, first } from 'rxjs';
import { Course } from '../../core/interfaces/course';
import { AuthService } from 'src/app/core/services/auth.service';
import { UserService } from 'src/app/core/services/user.service.service';
import { CourseService } from 'src/app/core/services/course.service';
import { User } from 'src/app/core/interfaces/user';

@Component({
  selector: 'app-home',
  standalone: true,
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    ɵEmptyOutletComponent,
  ],
})
export class HomeComponent implements OnInit {
  private _authService: AuthService = inject(AuthService);
  private _userService: UserService = inject(UserService);
  private _courseService: CourseService = inject(CourseService);
  private _router: Router = inject(Router);
  private _cdr: ChangeDetectorRef = inject(ChangeDetectorRef);

 newUser: User[] = [];
  currentUserIndex: number = 0;
  course: Course[] = [];
  comments: Comment[] = [];
  filterName: string = '';
  username: string = '';
  minPrice: number | null = null;
  maxPrice: number | null = null;
  currentPage: number = 1;
  itemsPerPage: number = 12;
  hasMore = false;
  currentUserId: number | null = null;
  isLoading: boolean = true;
  id: any = this._userService.getCurrentUserId();
  popularCourses: any[] = [];

  //Role
  cantCreate: boolean = false;

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
      this.username = this.currentUser?.fristName || 'Usuario';
      this.currentUserId = this._userService.getCurrentUserId();
      this.getCourse();
      this._courseService.allCourses();

      this.filterForm.valueChanges.subscribe((_values) => {
        this.currentPage = 1;
        this.getCourse();
        console.log(_values);
      });
    }
  }

  get currentUser(): User | null {
    return this.newUser.length > 0
      ? this.newUser[this.currentUserIndex]
      : null;
  }


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
            return { ...course, averageRating };
          });
          // If the number of courses equals the items per page, assume that more comments are available.
          this.hasMore = this.course.length === this.itemsPerPage;
        },
        error: (error) => {
          console.error('Error al obtener cursos:', error);
        },
      });
  }

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

  // Navigates to the course details page.
  navigateToDetailsCourse(id: number): void {
    this._router.navigate(['/courseDetails/' + id]);
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
  const id = this._userService.getCurrentUserId(); // Esto debería devolver 3
  if (id) {
    this._router.navigate(['/user', id]);
  }
}
  navigateToLogout(): void {
    this._authService.logout();
  }

  /**
   * Deletes a courses by ID and updates local course list.
   *
   * @param {number} id - ID of the course to delete
   */
  deleteCourse(id: number): void {
    if (!id) {
      return;
    }

    this._courseService.deleteCourse(id).subscribe({
      next: () => {
        // Update local course array by filtering out deleted course
        this.course = this.course.filter((p) => p.id !== id);
      },
      error: (err: any) => {
        console.error('Error deleting course:', err);
        // TODO: Implementar un toastSevice
      },
    });
  }

  rolePermisson() {
  const role = this._userService.getUserRole();
  console.log("Rol detectado:", role); // Agrega este log para depurar

  if (role === 'COURSE_SUPPLIER') {
    this.cantCreate = true;
    this._cdr.detectChanges();
  }
  console.log(role);
  console.log("AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA");
}

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
