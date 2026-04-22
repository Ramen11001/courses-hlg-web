import { inject, Injectable } from '@angular/core';
import { User } from '../interfaces/user';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { catchError, Observable, throwError } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.baseUrl}/user`;
  private handleError(error: HttpErrorResponse) {
    console.error('Error en la petición:', error);

    if (error.status === 403) {
      console.error('Acceso denegado - Verifica tus credenciales o permisos');
    }

    return throwError(
      () => new Error('Ocurrió un error al procesar la solicitud'),
    );
  }

  getbirthdayMsg() {
    return this.http.get<User>(`${environment.baseUrl}/getCongratsMessages`);
  }

  /**
   * Retrieves the current user's ID from localStorage.
   * @function
   * @returns {number | null} - Returns the user ID if available, otherwise null.
   */
  getCurrentUserId(): number | null {
    const user_id = localStorage.getItem('user_id');
    return user_id ? parseInt(user_id, 10) : null;
  }

  /**
   * Deletes users by ID.
   * @param {number} id - user ID to delete
   * @returns {Observable<User>} Observable of deleted user
   * @throws {Error} If users ID is not provided
   */
  deleteUser(id: number) {
    if (!id) {
      return throwError(() => new Error('Usuario no encontrado'));
    }
    return this.http.delete<User>(`${this.apiUrl}/${id}`);
  }
  /**
     * get user role
     * @returns role
     * 
    */
  getUserRole() {
    return localStorage.getItem('role')
  }

  /**
    * Creates a user.
    *
    * @function
    * @returns {Observable<User>} Observable containing saved user
    * @throws {Error} If user is not authenticated
    */
  singUp(userData: User): Observable<User> {
    const fullUserData: User = {
      ...userData!
    };
    return this.http
      .post<User>(this.apiUrl, fullUserData)
      .pipe(catchError(this.handleError));
  }

  /** 
    *  updates a user.
    * @param {number | null} id - user ID (null for new user)
    * @param {Omit<User, 'id'>} [userData] - user data 
    * @returns {Observable<User>} Observable of saved user
    * @throws {Error} Authentication or ownership errors
    */
  updatedUser(id: number, userData?: Omit<User, 'password'>) {
    const currentUser = this.getCurrentUserId();
    if (id !== currentUser) {
      return throwError(() => 'Solo puedes editar tu usuario');
    }
    return this.http
      .put<User>(`${this.apiUrl}/${id}`, userData)
      .pipe(
        catchError((error) =>
          throwError(() => 'Error al actualizar el curso'),
        ),);
  }


  /**
   * Gets single user by ID.
   * @param {number} id - user ID
   * @returns {Observable<User>} Observable containing requested user
   */
getUserById(id: number): Observable<User> {
  return this.http.get<User>(`${this.apiUrl}/${id}`); 
}

  /**
     * Fetches all users without filters or pagination.
     * @returns {Observable<Course[]>} Observable containing all users
     */
  allUsers() {
    return this.http.get<User[]>(`${this.apiUrl}`);
  }
}
