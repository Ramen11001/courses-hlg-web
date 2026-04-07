import { Routes } from '@angular/router';
import { SignUpComponent } from './feature/auth/sign-up/sign-up.component';
import { ForgotPasswordComponent } from './feature/auth/forgot-password/forgot-password.component';
import { LoginComponent } from './feature/auth/login/login.component';
import { HomeComponent } from './feature/home/home.component';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full',
  },

  {
    path: 'login',
    component: LoginComponent,
  },

  {
    path: 'singUp',
    component: SignUpComponent,
  },

  {
    path: 'forgotPassword',
    component: ForgotPasswordComponent,
  },

  {
    path: 'home',
    component: HomeComponent,
  },
];
