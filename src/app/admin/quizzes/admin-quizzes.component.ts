import { CommonModule } from '@angular/common';
import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { finalize } from 'rxjs';
import { AdminQuizRecord, AdminQuizService } from '../../core/admin-quiz.service';
import { AuthService } from '../../core/auth.service';

interface QuizQuestionEditor {
  question: string;
  options: string[];
  correctAnswer: string;
}

@Component({
  selector: 'app-admin-quizzes',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-quizzes.component.html',
  styleUrl: './admin-quizzes.component.scss'
})
export class AdminQuizzesComponent {
  readonly quizzes = signal<AdminQuizRecord[]>([]);
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly viewMode = signal<'library' | 'editor'>('library');
  readonly editingId = signal<string | null>(null);
  readonly errorMessage = signal('');
  readonly successMessage = signal('');
  readonly questionIndex = signal(0);

  title = '';
  questions: QuizQuestionEditor[] = [this.createQuestion()];

  constructor(
    readonly authService: AuthService,
    private readonly quizService: AdminQuizService,
    private readonly router: Router
  ) {
    if (!this.authService.getToken()) {
      void this.router.navigateByUrl('/admin/login');
      return;
    }
    if (!this.authService.isAdmin()) {
      void this.router.navigateByUrl('/admin/dashboard');
      return;
    }
    this.loadData();
  }

  loadData(): void {
    this.loading.set(true);
    this.errorMessage.set('');
    this.quizService.getQuizzes().pipe(finalize(() => this.loading.set(false))).subscribe({
      next: ({ data }) => this.quizzes.set(data),
      error: (error: HttpErrorResponse) => this.errorMessage.set(this.readError(error, 'Could not load quizzes.'))
    });
  }

  openCreate(): void {
    this.resetForm();
    this.viewMode.set('editor');
  }

  openEdit(quiz: AdminQuizRecord): void {
    this.resetForm();
    this.editingId.set(quiz.quizId);
    this.title = quiz.title;
    this.questions = quiz.questions.map((question) => ({
      question: question.question,
      options: [...question.options],
      correctAnswer: question.correctAnswer
    }));
    this.questionIndex.set(0);
    this.viewMode.set('editor');
  }

  cancelEditor(): void {
    this.viewMode.set('library');
    this.resetForm();
  }

  addQuestion(): void {
    if (this.questions.length < 10) {
      this.questions = [...this.questions, this.createQuestion()];
      this.questionIndex.set(this.questions.length - 1);
    }
  }

  removeQuestion(questionIndex: number): void {
    if (this.questions.length > 1) {
      this.questions = this.questions.filter((_, index) => index !== questionIndex);
      if (questionIndex < this.questionIndex()) {
        this.questionIndex.update((index) => index - 1);
      } else if (questionIndex === this.questionIndex()) {
        this.questionIndex.set(Math.min(questionIndex, this.questions.length - 1));
      }
    }
  }

  previousQuestion(): void {
    this.questionIndex.update((index) => Math.max(index - 1, 0));
  }

  nextQuestion(): void {
    this.questionIndex.update((index) => Math.min(index + 1, this.questions.length - 1));
  }

  saveQuiz(): void {
    this.errorMessage.set('');
    this.successMessage.set('');
    const validationMessage = this.validateForm();
    if (validationMessage) {
      this.errorMessage.set(validationMessage);
      return;
    }

    const payload = {
      title: this.title.trim(),
      questions: this.questions.map((question) => ({
        question: question.question.trim(),
        options: question.options.map((option) => option.trim()),
        correctAnswer: question.correctAnswer.trim()
      }))
    };
    const editingId = this.editingId();
    const request = editingId
      ? this.quizService.updateQuiz(editingId, payload)
      : this.quizService.createQuiz(payload);

    this.saving.set(true);
    request.subscribe({
      next: ({ message }) => {
        this.successMessage.set(message);
        this.viewMode.set('library');
        this.resetForm();
        this.loadData();
      },
      error: (error: HttpErrorResponse) => {
        this.errorMessage.set(this.readError(error, 'Could not save quiz.'));
        this.saving.set(false);
      },
      complete: () => this.saving.set(false)
    });
  }

  deleteQuiz(quiz: AdminQuizRecord): void {
    if (!window.confirm(`Delete "${quiz.title}"? Candidate attempts will also be deleted.`)) {
      return;
    }

    this.errorMessage.set('');
    this.successMessage.set('');
    this.quizService.deleteQuiz(quiz.quizId).subscribe({
      next: ({ message }) => {
        this.successMessage.set(message);
        this.quizzes.update((current) => current.filter((item) => item.quizId !== quiz.quizId));
      },
      error: (error: HttpErrorResponse) => this.errorMessage.set(this.readError(error, 'Could not delete quiz.'))
    });
  }

  trackByIndex(index: number): number {
    return index;
  }

  private validateForm(): string | null {
    if (!this.title.trim()) {
      return 'Enter a quiz title.';
    }
    if (this.questions.length < 1 || this.questions.length > 10) {
      return 'A quiz must contain between 1 and 10 questions.';
    }

    for (const [index, question] of this.questions.entries()) {
      if (!question.question.trim()) {
        return `Enter question ${index + 1}.`;
      }
      if (question.options.length !== 3 || question.options.some((option) => !option.trim())) {
        return `Question ${index + 1} needs exactly 3 non-empty options.`;
      }
      if (!question.correctAnswer || !question.options.some((option) => option.trim() === question.correctAnswer.trim())) {
        return `Choose the correct answer for question ${index + 1}.`;
      }
    }
    return null;
  }

  private createQuestion(): QuizQuestionEditor {
    return { question: '', options: ['', '', ''], correctAnswer: '' };
  }

  private resetForm(): void {
    this.editingId.set(null);
    this.title = '';
    this.questions = [this.createQuestion()];
    this.questionIndex.set(0);
    this.errorMessage.set('');
  }

  private readError(error: HttpErrorResponse, fallback: string): string {
    return error.error?.message || fallback;
  }
}
