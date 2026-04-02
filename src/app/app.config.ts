import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { routes } from './app.routes';
import { tokenIntrception } from './http-token2.interceptor';


/**
 * Global application configuration.
 * Defines providers for routing and HTTP client services.
 *
 * @constant
 * @type {ApplicationConfig}
 */
export const appConfig: ApplicationConfig = {
  providers: [
    /**
     * Global application configuration.
     * Defines providers for routing and HTTP client services.
     *
     * @constant
     * @type {ApplicationConfig}
     */
    provideRouter(routes),
    /**
     * Global application configuration.
     * Defines providers for routing and HTTP client services.
     *
     * @constant
     * @type {ApplicationConfig}
     */
    provideHttpClient(withInterceptors([tokenIntrception])),
  ],
};
