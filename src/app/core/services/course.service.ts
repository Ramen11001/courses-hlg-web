import {
  HttpClient,
  HttpErrorResponse,
  HttpHeaders,
} from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { throwError, Observable, switchMap, catchError } from 'rxjs';
import { environment } from 'src/environments/environment';
import { Course } from '../interfaces/course';
import { UserService } from './user.service.service';

@Injectable({
  providedIn: 'root',
})
export class CourseService {

  private _userService: UserService = inject(UserService);
  private apiUrl = `${environment.baseUrl}/courses`;
  private http = inject(HttpClient);

  handleError(error: HttpErrorResponse) {
    console.error('Error en la petición:', error);

    if (error.status === 403) {
      console.error('Acceso denegado - Verifica tus credenciales o permisos');
    }

    return throwError(
      () => new Error('Ocurrió un error al procesar la solicitud'),
    );
  }

  /**
   * Fetches all courses with filters or pagination.
   */
  getCourses(
    filterName: string,
    minPrice: number | null,
    maxPrice: number | null,
    currentPage: number,
    limit: number,
  ): Observable<Course[]> {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });
    const offset = (currentPage - 1) * limit;
    const params: any = {
      search: filterName,
      minPrecio: minPrice !== null ? minPrice : undefined,
      maxPrecio: maxPrice !== null ? maxPrice : undefined,
      page: currentPage,
      limit: limit,
      offset: offset,
      include: 'comments',
      pagination: 'true',
    };
    return this.http.get<Course[]>(`${environment.baseUrl}/courses`, {
      params,
      headers,
    });
  }


  /**
   * Fetches all courses without filters or pagination.
   * @returns {Observable<Course[]>} Observable containing all courses
   */
  allCourses() {
    return this.http.get<Course[]>(`${this.apiUrl}`);
  }

  /**
   * Gets single course by ID.
   * @param {number} id - course ID
   * @returns {Observable<Course>} Observable containing requested course
   */
  getcourseId(id: number): Observable<Course> {
    return this.http.get<Course>(`${this.apiUrl}/${id}`);
  }

  /**
   * Gets course by user ID.
   * @param {number} id - course ID
   * @returns {Observable<Course>} Observable containing requested course
   */
  getCourseByUserId(user_id: number) {
    return this.http.get<Course[]>(`${this.apiUrl}/${user_id}`);
  }


  /**
   * Creates or updates a course.
   *
   * @param {number | null} id - course ID (null for new course)
   * @param {any} courseData - course data (sin id para creación, con id opcional para actualización)
   * @returns {Observable<Course>} Observable of saved course
   */
  saveCourse(id: number | null, courseData: any): Observable<Course> {
    const currentUserId = this._userService.getCurrentUserId();
    const currentUserRole = this._userService.getUserRole();

    // Update existing course
    if (id) {
      // First check if user has permission to edit
      return this.getcourseId(id).pipe(
        switchMap((course) => {
          if (!currentUserId) {
            return throwError(
              () => new Error('Debes iniciar sesión para editar cursos'),
            );
          }

          if (course.user_id !== currentUserId) {
            return throwError(
              () => new Error('Solo puedes editar tus propios cursos'),
            );
          }

          if (currentUserRole !== 'COURSE_SUPPLIER') {
            return throwError(
              () => new Error('No tienes permisos para editar cursos'),
            );
          }

          //for update, only the necesary atributes
          return this.http
            .put<Course>(`${this.apiUrl}/${id}`, courseData)
            .pipe(catchError(this.handleError));
        }),
        catchError((error) => throwError(() => error)),
      );
    }

    // Create new course
    else {
      if (!currentUserId) {
        return throwError(
          () => new Error('Debes iniciar sesión para crear cursos'),
        );
      }

      if (currentUserRole !== 'COURSE_SUPPLIER') {
        return throwError(
          () => new Error('Solo los profesores pueden crear cursos'),
        );
      }

      //reate new course
      const fullCourseData = {
        title: courseData.title,
        cost: courseData.cost,
        area: courseData.area,
        mode: courseData.mode,
        level: courseData.level,
        certificate: courseData.certificate,
        description: courseData.description,
        study_plan: courseData.study_plan,
        location: courseData.location,
        duration: courseData.duration,
        tags: courseData.tags,
        user_id: currentUserId,
      };

      return this.http
        .post<Course>(this.apiUrl, fullCourseData)
        .pipe(catchError(this.handleError));
    }
  }
  /**
   * Deletes course by ID.
   * @param {number} id - course ID to delete
   * @returns {Observable<Course>} Observable of deleted course
   * @throws {Error} If course ID is not provided
   */
  deleteCourse(id: number) {
    if (!id) {
      return throwError(() => new Error('Curso no encontrado'));
    }
    return this.http.delete<Course>(`${this.apiUrl}/${id}`);
  }
}
