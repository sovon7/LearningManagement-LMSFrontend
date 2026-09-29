import { CommonModule } from '@angular/common';
import { Component, signal } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth.service';

@Component({
  selector: 'app-admin-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss'
})
export class RegisterComponent {
  readonly isSubmitting = signal(false);
  readonly errorMessage = signal('');
  readonly successMessage = signal('');

  readonly form: FormGroup<{
    userName: FormControl<string>;
    userEmail: FormControl<string>;
    password: FormControl<string>;
  }>;

  constructor(
    private readonly fb: FormBuilder,
    private readonly authService: AuthService,
    private readonly router: Router
  ) {
    this.form = this.fb.nonNullable.group({
      userName: this.fb.nonNullable.control('', [Validators.required, Validators.minLength(2)]),
      userEmail: this.fb.nonNullable.control('', [Validators.required, Validators.email]),
      password: this.fb.nonNullable.control('', [Validators.required, Validators.minLength(6)])
    });
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.errorMessage.set('Please fill in all fields correctly.');
      return;
    }

    const { userName, userEmail, password } = this.form.getRawValue();
    this.isSubmitting.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');

    this.authService.register(userName, userEmail, password).subscribe({
      next: () => {
        this.successMessage.set('Registration successful. Redirecting to dashboard...');
        setTimeout(() => this.router.navigateByUrl('/admin/dashboard'), 600);
      },
      error: (err) => {
        this.errorMessage.set(err?.error?.message || 'Registration failed.');
        this.isSubmitting.set(false);
      },
      complete: () => {
        this.isSubmitting.set(false);
      }
    });
  }
}
