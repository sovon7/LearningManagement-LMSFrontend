import { Routes } from '@angular/router';
import { ADMIN_ROUTES } from './admin/admin.routes';
import { CANDIDATE_ROUTES } from './Candidate/candidate.routes';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/admin/login',
    pathMatch: 'full'
  },
  {
    path: 'admin',
    children: ADMIN_ROUTES
  },
  {
    path: 'candidate',
    children: CANDIDATE_ROUTES
  }
];
