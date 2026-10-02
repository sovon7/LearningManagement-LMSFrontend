import { CommonModule } from '@angular/common';
import { Component, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../core/auth.service';

interface PortalNavigationItem {
  label: string;
  adminRoute: string;
  candidateRoute: string;
}

@Component({
  selector: 'app-portal-shell',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './portal-shell.component.html',
  styleUrl: './portal-shell.component.scss'
})
export class PortalShellComponent {
  readonly profileOpen = signal(false);

  readonly navigation: PortalNavigationItem[] = [
    { label: 'Dashboard', adminRoute: '/admin/dashboard', candidateRoute: '/candidate/dashboard' },
    { label: 'Blog', adminRoute: '/admin/blog', candidateRoute: '/candidate/blog' },
    { label: 'Course', adminRoute: '/admin/courses', candidateRoute: '/candidate/courses' },
    { label: 'Video', adminRoute: '/admin/video', candidateRoute: '/candidate/video' },
    { label: 'General Quiz', adminRoute: '/admin/quizzes', candidateRoute: '/candidate/quizzes' }
  ];

  constructor(
    readonly authService: AuthService,
    private readonly router: Router
  ) {
    if (!this.authService.getToken()) {
      void this.router.navigateByUrl('/admin/login');
      return;
    }

    const requestedAdminPortal = this.router.url.startsWith('/admin/');
    if (requestedAdminPortal !== this.authService.isAdmin()) {
      void this.router.navigateByUrl(this.authService.isAdmin() ? '/admin/dashboard' : '/candidate/dashboard');
    }
  }

  get isAdmin(): boolean {
    return this.authService.isAdmin();
  }

  get userName(): string {
    const user = this.authService.currentUser();
    return user?.userName || user?.name || 'User';
  }

  get userEmail(): string {
    const user = this.authService.currentUser();
    return user?.userEmail || user?.email || '';
  }

  get currentSection(): string {
    const currentPath = this.router.url.split('?')[0];
    return this.navigation.find((item) =>
      currentPath === (this.isAdmin ? item.adminRoute : item.candidateRoute)
    )?.label || 'Dashboard';
  }

  toggleProfile(): void {
    this.profileOpen.update((isOpen) => !isOpen);
  }

  closeProfile(): void {
    this.profileOpen.set(false);
  }

  logout(): void {
    this.authService.logout();
  }
}
