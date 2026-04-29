// src/app/core/services/enrollment.service.ts

import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { Enrollment, EnrollmentWithCourse } from '../interfaces/enrollment';

@Injectable({
  providedIn: 'root'
})
export class EnrollmentService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.baseUrl}/enrollments`;

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    });
  }

  /**
   * Enroll a user in a course
   * @param courseId - Course ID to enroll in
   */
  enrollInCourse(courseId: number): Observable<Enrollment> {
    const headers = this.getAuthHeaders();
    const body = { course_id: courseId };
    
    return this.http.post<Enrollment>(`${this.apiUrl}`, body, { headers })
      .pipe(catchError(this.handleError));
  }

  /**
   * Check if user is enrolled in a specific course
   * @param courseId - Course ID to check
   */
  isEnrolled(courseId: number): Observable<boolean> {
    const headers = this.getAuthHeaders();
    return this.http.get<boolean>(`${this.apiUrl}/check/${courseId}`, { headers })
      .pipe(catchError(this.handleError));
  }

  /**
   * Get user's enrolled courses
   */
  getMyEnrollments(): Observable<EnrollmentWithCourse[]> {
    const headers = this.getAuthHeaders();
    return this.http.get<EnrollmentWithCourse[]>(`${this.apiUrl}/my-enrollments`, { headers })
      .pipe(catchError(this.handleError));
  }

  /**
   * Cancel enrollment
   * @param enrollmentId - Enrollment ID to cancel
   */
  cancelEnrollment(enrollmentId: number): Observable<void> {
    const headers = this.getAuthHeaders();
    return this.http.delete<void>(`${this.apiUrl}/${enrollmentId}`, { headers })
      .pipe(catchError(this.handleError));
  }

  /**
   * Update enrollment progress
   * @param enrollmentId - Enrollment ID
   * @param progress - Progress percentage (0-100)
   */
  updateProgress(enrollmentId: number, progress: number): Observable<Enrollment> {
    const headers = this.getAuthHeaders();
    return this.http.patch<Enrollment>(`${this.apiUrl}/${enrollmentId}/progress`, { progress }, { headers })
      .pipe(catchError(this.handleError));
  }

  /**
   * Add rating and review to enrolled course
   * @param enrollmentId - Enrollment ID
   * @param rating - Rating (1-5)
   * @param review - Review text
   */
  addReview(enrollmentId: number, rating: number, review: string): Observable<Enrollment> {
    const headers = this.getAuthHeaders();
    return this.http.post<Enrollment>(`${this.apiUrl}/${enrollmentId}/review`, { rating, review }, { headers })
      .pipe(catchError(this.handleError));
  }

  private handleError(error: any): Observable<never> {
    console.error('Error en EnrollmentService:', error);
    return throwError(() => error.error?.message || 'Error al procesar la solicitud');
  }
}