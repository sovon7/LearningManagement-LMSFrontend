import { CommonModule } from '@angular/common';
import { Component, signal } from '@angular/core';
import { Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthService } from '../../core/auth.service';
import {
  CandidateQuizAttempt,
  CandidateQuizQuestion,
  CandidateQuizService,
  CandidateQuizSummary
} from '../../core/candidate-quiz.service';

@Component({
  selector: 'app-candidate-quizzes',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './candidate-quizzes.component.html',
  styleUrl: './candidate-quizzes.component.scss'
})
export class CandidateQuizzesComponent {
  readonly quizzes = signal<CandidateQuizSummary[]>([]);
  readonly loading = signal(false);
  readonly loadingQuizId = signal<string | null>(null);
  readonly submitting = signal(false);
  readonly errorMessage = signal('');
  readonly quizDetails = signal<{ quizId: string; title: string; questions: CandidateQuizQuestion[] } | null>(null);
  readonly questionIndex = signal(0);
  readonly selectedAnswers = signal<(number | null)[]>([]);
  readonly result = signal<CandidateQuizAttempt | null>(null);

  constructor(
    readonly authService: AuthService,
    private readonly candidateQuizService: CandidateQuizService,
    private readonly router: Router
  ) {
    if (!this.authService.getToken()) {
      void this.router.navigateByUrl('/admin/login');
      return;
    }
    if (this.authService.isAdmin()) {
      void this.router.navigateByUrl('/admin/dashboard');
      return;
    }
    this.loadQuizzes();
  }

  loadQuizzes(): void {
    this.loading.set(true);
    this.errorMessage.set('');
    this.candidateQuizService.getQuizzes().subscribe({
      next: ({ data }) => this.quizzes.set(data),
      error: (error: HttpErrorResponse) => {
        this.errorMessage.set(this.readError(error, 'Could not load quizzes.'));
        this.loading.set(false);
      },
      complete: () => this.loading.set(false)
    });
  }

  startQuiz(quiz: CandidateQuizSummary): void {
    if (quiz.attempt || this.loadingQuizId()) {
      return;
    }

    this.errorMessage.set('');
    this.loadingQuizId.set(quiz.quizId);
    this.candidateQuizService.getQuiz(quiz.quizId).subscribe({
      next: ({ data }) => {
        this.quizDetails.set(data);
        this.questionIndex.set(0);
        this.selectedAnswers.set(data.questions.map(() => null));
        this.result.set(null);
      },
      error: (error: HttpErrorResponse) => {
        this.errorMessage.set(this.readError(error, 'Could not open this quiz.'));
        this.loadingQuizId.set(null);
      },
      complete: () => this.loadingQuizId.set(null)
    });
  }

  selectAnswer(optionIndex: number): void {
    const answers = [...this.selectedAnswers()];
    answers[this.questionIndex()] = optionIndex;
    this.selectedAnswers.set(answers);
  }

  nextQuestion(): void {
    if (this.selectedAnswers()[this.questionIndex()] === null) {
      return;
    }
    this.questionIndex.update((index) => Math.min(index + 1, (this.quizDetails()?.questions.length ?? 1) - 1));
  }

  previousQuestion(): void {
    this.questionIndex.update((index) => Math.max(index - 1, 0));
  }

  submitQuiz(): void {
    const quiz = this.quizDetails();
    const answers = this.selectedAnswers();
    if (!quiz || answers.some((answer) => answer === null)) {
      this.errorMessage.set('Answer every question before submitting.');
      return;
    }

    this.errorMessage.set('');
    this.submitting.set(true);
    this.candidateQuizService.submitQuiz(quiz.quizId, answers as number[]).subscribe({
      next: ({ data }) => {
        this.result.set(data);
        this.loadQuizzes();
      },
      error: (error: HttpErrorResponse) => {
        this.errorMessage.set(this.readError(error, 'Quiz submission failed.'));
        this.submitting.set(false);
      },
      complete: () => this.submitting.set(false)
    });
  }

  closeQuiz(): void {
    this.quizDetails.set(null);
    this.selectedAnswers.set([]);
    this.questionIndex.set(0);
    this.result.set(null);
    this.errorMessage.set('');
  }

  currentQuestion(): CandidateQuizQuestion | null {
    return this.quizDetails()?.questions[this.questionIndex()] ?? null;
  }

  allAnswered(): boolean {
    const answers = this.selectedAnswers();
    return answers.length > 0 && answers.every((answer) => answer !== null);
  }

  readError(error: HttpErrorResponse, fallback: string): string {
    return error.error?.message || fallback;
  }

  logout(): void {
    this.authService.logout();
  }
}
