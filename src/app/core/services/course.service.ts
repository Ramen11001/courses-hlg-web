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
  private apiUrl = `${environment.baseUrl}/course`;
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
   * Creates or updates a course.
   *
   * @param {number | null} id - course ID (null for new course)
   * @param {Omit<Course, 'user_id'>} [courseData] - course data (without userId)
   * @returns {Observable<Course>} Observable of saved course
   * @throws {Error} Authentication or ownership errors
   */
  saveCourse(id: number | null, courseData?: Omit<Course, 'user_id'>) {
    const role = this._userService.getCurrentUserRole();
    if (id) {
      return this.getcourseId(id).pipe(
        switchMap((course) => {
          const currentUser = this._userService.getCurrentUserId();
          if (currentUser === null) {
            return throwError(() => 'Debes iniciar sesión para editar cursos');
          }
          if (course.user_id !== currentUser) {
            return throwError(() => 'Solo puedes editar tus propios cursos');
          }
          if (role !== "COURSE_SUPPLIER") {
            return throwError(() => 'Solo puedes editar tus propios cursos si eres profesor');
          }
          return this.http
            .put<Course>(`${this.apiUrl}/${id}`, courseData)
            .pipe(
              catchError(() =>
                throwError(() => 'Error al actualizar el curso'),
              ),
            );
        }),
        catchError((error) => throwError(() => error)),
      );
    } else {
      const role = this._userService.getCurrentUserRole();
      const userId = this._userService.getCurrentUserId();
      if (!userId) {
        return throwError(() => new Error('Usuario no autenticado'));
      }
      if (role !== "COURSE_SUPPLIER") {
        return throwError(() => 'Solo puede crear cursos un profesor');
      }
      const fullCourseData: Course = {
        ...courseData!,
        user_id: userId,
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
