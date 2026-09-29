import { CommonModule } from '@angular/common';
import { Component, signal } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth.service';

@Component({
  selector: 'app-admin-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {
  readonly isSubmitting = signal(false);
  readonly errorMessage = signal('');

  readonly form: FormGroup<{
    userEmail: FormControl<string>;
    password: FormControl<string>;
  }>;

  constructor(
    private readonly fb: FormBuilder,
    private readonly authService: AuthService,
    private readonly router: Router
  ) {
    this.form = this.fb.nonNullable.group({
      userEmail: this.fb.nonNullable.control('', [Validators.required, Validators.email]),
      password: this.fb.nonNullable.control('', [Validators.required, Validators.minLength(6)])
    });
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.errorMessage.set('Please enter a valid email and password.');
      return;
    }

    const { userEmail, password } = this.form.getRawValue();
    this.isSubmitting.set(true);
    this.errorMessage.set('');

    this.authService.login(userEmail, password).subscribe({
      next: () => {
        this.router.navigateByUrl(this.authService.isAdmin() ? '/admin/dashboard' : '/candidate/quizzes');
      },
      error: (err) => {
        this.errorMessage.set(err?.error?.message || 'Login failed. Please try again.');
        this.isSubmitting.set(false);
      },
      complete: () => {
        this.isSubmitting.set(false);
      }
    });
  }
}
