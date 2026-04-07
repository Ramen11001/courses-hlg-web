import { Injectable, inject } from '@angular/core';
import {
  HttpClient,
  HttpErrorResponse,
  HttpHeaders,
} from '@angular/common/http';
import { catchError, Observable, throwError } from 'rxjs';
import { environment } from 'src/environments/environment';
import { Comment } from 'src/app/core/interfaces/comment';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root',
})
export class CommentsService {
  private apiUrl = `${environment.baseUrl}/comments`;
  private http = inject(HttpClient);
  private authService = inject(AuthService);

  /**
   * Fetches comments for a specific course.
   * - Sends HTTP GET request to `/comments` endpoint with courseId filter
   * - Includes error handling for failed requests
   *
   * @function
   * @param {number} course_id - ID of the course to get comments for
   * @returns {Observable<Comment[]>} Observable containing array of comments
   */
  getCommentsByCourse(course_id: number): Observable<Comment[]> {
    return this.http
      .get<Comment[]>(`${this.apiUrl}/home/${course_id}`)
      .pipe(catchError(this.handleError));
  }

  /**
   * Creates a comment.
   * - For new comments: Assigns current user as comment owner
   * - Validates user authentication before proceeding
   *
   * @function
   * @param {number | null} id - Comment ID (null for new comments)
   * @param {Omit<Comment, 'userId' | 'id'>} commentData - Comment data without user or ID fields
   * @returns {Observable<Comment>} Observable containing saved comment
   * @throws {Error} If user is not authenticated
   */
  createComment(
    id: number | null,
    commentData: Omit<Comment, 'user_id' | 'id' | 'User'>,
  ): Observable<Comment> {
    const userId = this.authService.getCurrentUserId();
    if (!userId) {
      return throwError(() => new Error('Usuario no autenticado'));
    }

    const fullCommentData: Partial<Comment> = {
      ...commentData,
      user_id: userId,
    };

    if (id !== null) {
      fullCommentData.id = id;
    }

    return this.http
      .post<Comment>(this.apiUrl, fullCommentData, {
        params: { expand: 'user' },
      })
      .pipe(catchError(this.handleError));
  }

  /**
   * Centralized error handling for HTTP requests.
   * - Intercepts HTTP error responses from all service methods
   * - Converts technical errors into user-friendly messages
   * - Returns a throwable observable with standardized error message
   *
   * @function
   * @private
   * @param {HttpErrorResponse} error - Original error response from HttpClient
   * @returns {Observable<never>} Observable that immediately errors with simplified message
   */
  private handleError(error: HttpErrorResponse) {
    return throwError(
      () => new Error('Ocurrió un error al procesar la solicitud'),
    );
  }

  /**
   * Deletes a comment by ID.
   * - Validates comment ID is provided
   * - Sends HTTP DELETE request to comments endpoint
   *
   * @function
   * @param {number} id - ID of the comment to delete
   * @returns {Observable<void>} Empty observable on success
   * @throws {Error} If comment ID is invalid
   */
  deleteComment(id: number): Observable<void> {
    if (!id) {
      return throwError(() => new Error('ID de comentario inválido'));
    }
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
