import { Routes } from '@angular/router';
import { LoginComponent } from './features/login/login.component';

export const routes: Routes = [
  /**
   * Redirects the base URL (`/`) to the login page.
   * Ensures a default route is provided when no specific path is entered.
   *
   * @route /
   */
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full',
  },

  /**
   * Route for the login page.
   * Displays the `LoginComponent` where users can authenticate.
   *
   * @route /login
   * @component LoginComponent
   */
  {
    path: 'login',
    component: LoginComponent,
  },
];
