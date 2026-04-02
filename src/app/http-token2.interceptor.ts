import { HttpInterceptorFn } from "@angular/common/http";
import { AuthService } from "./core/services/auth.service";
import { inject } from "@angular/core";

export const tokenIntrception: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService)
  const token = authService.getToken();

  // Clone the request to add the authentication header
  if (token) {
    req = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

//Continue with the request and handle errors in a centralized manner.
  return next(req)
}
