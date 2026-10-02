import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth.service';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent {
  readonly cards = [
    { name: 'Blog', description: 'Share short, useful learning notes.', symbol: 'B', tone: 'coral' },
    { name: 'Course', description: 'Build structured lessons and topic content.', symbol: 'C', tone: 'green' },
    { name: 'Video', description: 'Explore learning videos and related resources.', symbol: 'V', tone: 'blue' },
    { name: 'General Quiz', description: 'Practice with topic-based multiple-choice quizzes.', symbol: 'Q', tone: 'gold' }
  ];

  constructor(
    private readonly authService: AuthService,
    private readonly router: Router
  ) {
    if (!this.authService.getToken()) {
      this.router.navigateByUrl('/admin/login');
    }
  }

  get currentUser() {
    return this.authService.currentUser;
  }

  get isAdmin(): boolean {
    const role = this.currentUser()?.userRole ?? this.currentUser()?.role ?? 'CANDIDATE';
    return String(role).toUpperCase() === 'ADMIN';
  }

  featureRoute(name: string): string {
    const prefix = this.isAdmin ? '/admin' : '/candidate';
    const path = name === 'General Quiz' ? 'quizzes' : name === 'Course' ? 'courses' : name.toLowerCase();
    return `${prefix}/${path}`;
  }

  accessFor(name: string): string {
    if (this.isAdmin) {
      return name === 'Blog' ? 'Read only' : 'Create · Edit · Delete';
    }
    if (name === 'Blog') return 'Create · Edit · Delete';
    if (name === 'General Quiz') return 'View · Attempt';
    return 'Read only';
  }

  logout(): void {
    this.authService.logout();
  }
}
