import { CommonModule } from "@angular/common";
import { HttpClient } from "@angular/common/http";
import { Component, OnInit, inject, ChangeDetectorRef } from "@angular/core";
import { FormsModule, ReactiveFormsModule, FormGroup, FormControl } from "@angular/forms";
import { Router } from "@angular/router";
import { finalize } from "rxjs";
import { Course } from "../../core/interfaces/course";
import { CourseService } from "src/app/core/services/course.service";

@Component({
  selector: 'app-home',
  standalone: true,
  templateUrl: './home.component.html',
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
})
export class HomeComponent implements OnInit {

  course: Course[] = [];
  firstName: string = '';
  minPrice: number | null = null;
  maxPrice: number | null = null;
  currentPage: number = 1;
  itemsPerPage: number = 12;
  hasMore = false;
  currentUserId: number | null = null;
  isLoading: boolean = true;
  cdr: ChangeDetectorRef = inject(ChangeDetectorRef);

  //TODO: authService: AuthService = inject(AuthService);
  courseService: CourseService = inject(CourseService);

  //Reactive Form
  filterForm: FormGroup = new FormGroup({
    filterName: new FormControl(''),
    minPrice: new FormControl(null),
    maxPrice: new FormControl(null),
  });

  /**
   * Initializes HomeComponent and manages user authentication redirection.
   *
   * @constructor
   * @param {Router} router - Manages route navigation.
   * @param {HttpClient} http - Handles HTTP requests.
   */
  constructor(
    private router: Router,
    private http: HttpClient,
  ) { }

  //TODO: Merge Develo 
  ngOnInit(): void {
    /**
  const token = this.authService.getToken();
  if (!token) {
    this.router.navigate(['/login']);
  } else {
    const storedUsername = this.authService.getUsername();
    this.username = storedUsername || 'Usuario';
    this.currentUserId = this.authService.getCurrentUserId();
    this.getCourses();

    this.filterForm.valueChanges.subscribe((_values) => {
      this.currentPage = 1;
      this.getCourses();
    });
  }
    */
  }


  //Retrieves courses from the backend using search filters and pagination.
  getCourse(): void {
    this.isLoading = true;
    const { filterName, minPrice, maxPrice } = this.filterForm.value;
    this.courseService
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
    this.router.navigate(['/courseDetails/' + id]);
  }

  // Navigates to the course creation page.
  navigateToCreateCourse(): void {
    this.router.navigate(['/createCourse']);
  }

  // Navigates to the course editing page for a specific course.

  navigateToEditCourse(id: number): void {
    this.router.navigate(['edit/' + id]);
  }

  /**
   * TODO:
  navigateToLogout(): void {
    this.authService.logout();
  }
 */

  /**
   * Deletes a courses by ID and updates local course list.
   * 
   * @param {number} id - ID of the course to delete
   */
  deleteCourse(id: number): void {
    if (!id) {
      return;
    }

    this.courseService.deleteCourse(id).subscribe({
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

  /**
       * Handles form submission.
       * - Call logout function for  logs out the user by removing the stored token
       * - if it is correct it presents the elements,
       * - if not, it returns to the login and does not let you enter /course
       
       *
       * @function
       */
  submit() {
    // this.authService.logout();
    this.course = [];
    // this.firstName = null;
    this.isLoading = false;
    this.router.navigate(['/login']);
  }
}
