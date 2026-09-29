import { Routes } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { RegisterComponent } from './register/register.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { CourseComponent } from './courses/course.component';
import { AdminQuizzesComponent } from './quizzes/admin-quizzes.component';
import { PortalShellComponent } from '../portal/portal-shell.component';
import { FeaturePlaceholderComponent } from '../portal/feature-placeholder.component';

export const ADMIN_ROUTES: Routes = [
  {
    path: 'login',
    component: LoginComponent
  },
  {
    path: 'register',
    component: RegisterComponent
  },
  {
    path: '',
    component: PortalShellComponent,
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: DashboardComponent },
      { path: 'blog', component: FeaturePlaceholderComponent, data: { featureName: 'Blog' } },
      { path: 'courses', component: CourseComponent },
      { path: 'video', component: FeaturePlaceholderComponent, data: { featureName: 'Video' } },
      { path: 'quizzes', component: AdminQuizzesComponent }
    ]
  }
];
