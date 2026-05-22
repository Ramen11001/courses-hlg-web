import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Router } from '@angular/router';
/**
 * Authentication service responsible for handling login, logout, and session management.
 *
 * @service
 * @class AuthService
 */
@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private baseUrl = environment.baseUrl;
  private http = inject(HttpClient);
  private router = inject(Router);

  /**
   * Sends login request to the authentication API.
   *
   * @function
   * @param {object} user - Contains email and password for authentication.
   * @returns {Observable<any>} - Returns the server response including authentication token.
   */
  login(user: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/auth/login`, user);
  }

  /**
   * In charge of storing elements of the user model.
   *
   * @function
   */
  saveAuthData(
    token: string,
    email: string,
    user_id: number,
    role: string,
    firstName: string,
  ): void {
    localStorage.setItem('token', token);
    localStorage.setItem('user_id', user_id.toString());
    localStorage.setItem('email', email);
     localStorage.setItem('role', role);
    localStorage.setItem('firstName', firstName);
    localStorage.removeItem('fristName');
  }

  /**
   * Logs out the user by removing the stored token and redirecting to the login page.
   *
   * @function
   */
 logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user_id');
    localStorage.removeItem('email');
    localStorage.removeItem('role');
    localStorage.removeItem('firstName');
    localStorage.removeItem('fristName');
    this.router.navigate(['/login']);
  }
  /**
   * Retrieves the stored authentication token from local storage.
   *
   * @function
   * @returns {string|null} - Returns the token if available, otherwise null.
   */
  getToken(): string | null {
    return localStorage.getItem('token');
  }

  /**
   * Determines if the user is authenticated by checking for a valid token.
   *
   * @function
   * @returns {boolean} - Returns `true` if a token exists, otherwise `false`.
   */
  isAuthenticated(): boolean {
    const token = this.getToken();
    return !!token; // Cheek if token exist
  }

  forgotPassword(email: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/auth/forgot-password`, { email });
  }

  confirmResetPassword(token: string, newPassword: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/auth/reset-password/${token}`, { newPassword });
  }

  //get user firstName
  getCurrentUserName(): string | null {
    return localStorage.getItem('firstName') || localStorage.getItem('fristName');
  }
}
