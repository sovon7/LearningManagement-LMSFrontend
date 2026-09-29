import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { AuthService } from './auth.service';

export interface CandidateQuizAttempt {
  correctCount: number;
  totalQuestions: number;
  scorePercentage: number;
  result: 'PASS' | 'FAIL';
  submittedAt: string;
}

export interface CandidateQuizSummary {
  quizId: string;
  title: string;
  questionCount: number;
  attempt: CandidateQuizAttempt | null;
}

export interface CandidateQuizQuestion {
  question: string;
  options: string[];
}

export interface CandidateQuizDetails {
  quizId: string;
  title: string;
  questions: CandidateQuizQuestion[];
}

interface ListResponse {
  data: CandidateQuizSummary[];
}

interface DetailsResponse {
  data: CandidateQuizDetails;
}

interface AttemptResponse {
  data: CandidateQuizAttempt;
  message: string;
}

@Injectable({ providedIn: 'root' })
export class CandidateQuizService {
  private readonly endpoint = 'http://localhost:5000/api/candidate/quizzes';

  constructor(
    private readonly http: HttpClient,
    private readonly authService: AuthService
  ) {}

  getQuizzes() {
    return this.http.get<ListResponse>(this.endpoint, { headers: this.authHeaders() });
  }

  getQuiz(quizId: string) {
    return this.http.get<DetailsResponse>(`${this.endpoint}/${quizId}`, { headers: this.authHeaders() });
  }

  submitQuiz(quizId: string, answers: number[]) {
    return this.http.post<AttemptResponse>(`${this.endpoint}/${quizId}/submit`, { answers }, { headers: this.authHeaders() });
  }

  private authHeaders() {
    return new HttpHeaders({ Authorization: `Bearer ${this.authService.getToken() ?? ''}` });
  }
}
