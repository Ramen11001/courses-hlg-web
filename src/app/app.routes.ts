import { Routes } from '@angular/router';
import { SignUpComponent } from './feature/auth/sign-up/sign-up.component';
import { ForgotPasswordComponent } from './feature/auth/forgot-password/forgot-password.component';
import { LoginComponent } from './feature/auth/login/login.component';
import { HomeComponent } from './feature/home/home.component';
import { CreateCourseComponent } from './feature/course-manage/create-course/create-course.component';
import { CoursesDetailsComponent } from './feature/course-manage/course-details/course-details.component';
import { EditCourseComponent } from './feature/course-manage/edit-course/edit-course.component';
import { authGuard } from './core/guards/auth-guard';

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
    canActivate: [authGuard],
  },
  {
    path: 'createCourse',
    component: CreateCourseComponent,
  },
  {
    path: 'courseDetails/:id',
    component: CoursesDetailsComponent,
  },
  {
    path: 'edit/:id',
    component: EditCourseComponent,
  },
];
