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
import { finalize } from 'rxjs';
import { Course } from '../../core/interfaces/course';
import { AuthService } from 'src/app/core/services/auth.service';
import { UserService } from 'src/app/core/services/user.service.service';
import { CourseService } from 'src/app/core/services/course.service';

@Component({
  selector: 'app-home',
  standalone: true,
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
  imports: [CommonModule, FormsModule, ReactiveFormsModule, ɵEmptyOutletComponent],
})
export class HomeComponent implements OnInit {

  private _authService: AuthService = inject(AuthService);
  private _userService: UserService = inject(UserService);
  private _courseService: CourseService = inject(CourseService);
  private _router: Router = inject(Router);
  private _cdr: ChangeDetectorRef = inject(ChangeDetectorRef);

  course: Course[] = [];
  firstName: string = '';
  minPrice: number | null = null;
  maxPrice: number | null = null;
  currentPage: number = 1;
  itemsPerPage: number = 12;
  hasMore = false;
  currentUserId: number | null = null;
  isLoading: boolean = true;


  //Role
  cantCreate: boolean = false
  role = this._userService.getCurrentUserRole();

  //Reactive Form
  filterForm: FormGroup = new FormGroup({
    filterName: new FormControl(''),
    minPrice: new FormControl(null),
    maxPrice: new FormControl(null),
  });


  //TODO: Merge Develo
  ngOnInit(): void {
    const token = this._authService.getToken();
    if (!token) {
      this._router.navigate(['/login']);
    } else {
      const storedUsername = this._authService.getCurrentUserName();
      this.firstName = storedUsername || 'Usuario';
      this.currentUserId = this._userService.getCurrentUserId();
      this.getCourse();

      this.filterForm.valueChanges.subscribe((_values) => {
        this.currentPage = 1;
        this.getCourse();
      });
    }
  }


  //TODO: LoadUsers

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
          // If the number of course equals the items per page, assume that more course are available.
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
    if (this.role === "COURSE_SUPPLIER") {
      this.cantCreate === true
      this._cdr.detectChanges();
    }
    return this.cantCreate
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
    this.firstName = '';
    this.isLoading = false;
    this._router.navigate(['/login']);
  }

}
