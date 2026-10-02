import { Routes } from '@angular/router';
import { CandidateQuizzesComponent } from './quizzes/candidate-quizzes.component';
import { DashboardComponent } from '../admin/dashboard/dashboard.component';
import { FeaturePlaceholderComponent } from '../portal/feature-placeholder.component';
import { PortalShellComponent } from '../portal/portal-shell.component';
import { BlogComponent } from '../blog/blog.component';

export const CANDIDATE_ROUTES: Routes = [
  {
    path: '',
    component: PortalShellComponent,
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: DashboardComponent },
      { path: 'blog', component: BlogComponent },
      { path: 'courses', component: FeaturePlaceholderComponent, data: { featureName: 'Course' } },
      { path: 'video', component: FeaturePlaceholderComponent, data: { featureName: 'Video' } },
      { path: 'quizzes', component: CandidateQuizzesComponent }
    ]
  }
];
