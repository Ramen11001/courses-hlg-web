import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from 'src/app/core/services/auth.service';
/**
 * Guard responsible for controlling access to protected routes.
 * If the user is authenticated, access is granted; otherwise, they are redirected to login.
 *
 * @service
 * @class AuthGuard
 * @implements {CanActivateFn}
 */
export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  /**
   * Determines if the route can be activated based on user authentication.
   * - If the user has a valid token, access is granted.
   * - If not, the user is redirected to the login page.
   *
   * @function
   * @returns {boolean} - Returns `true` if the user is authenticated, otherwise `false`.
   */
  const token = authService.getToken();
  if (token) {
    return true;
  } else {
    router.navigate(['/login']);
    return false;
  }
};
