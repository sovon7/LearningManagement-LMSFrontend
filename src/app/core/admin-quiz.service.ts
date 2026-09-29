import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { AuthService } from './auth.service';

export interface AdminQuizQuestion {
  question: string;
  options: string[];
  correctAnswer: string;
}

export interface AdminQuizRecord {
  quizId: string;
  title: string;
  questions: AdminQuizQuestion[];
}

interface QuizListResponse {
  data: AdminQuizRecord[];
}

interface QuizResponse {
  data: AdminQuizRecord;
  message: string;
}

@Injectable({ providedIn: 'root' })
export class AdminQuizService {
  private readonly endpoint = 'http://localhost:5000/api/admin/quizzes';

  constructor(
    private readonly http: HttpClient,
    private readonly authService: AuthService
  ) {}

  getQuizzes() {
    return this.http.get<QuizListResponse>(this.endpoint, { headers: this.authHeaders() });
  }

  createQuiz(payload: Omit<AdminQuizRecord, 'quizId'>) {
    return this.http.post<QuizResponse>(this.endpoint, payload, { headers: this.authHeaders() });
  }

  updateQuiz(quizId: string, payload: Omit<AdminQuizRecord, 'quizId'>) {
    return this.http.put<QuizResponse>(`${this.endpoint}/${quizId}`, payload, { headers: this.authHeaders() });
  }

  deleteQuiz(quizId: string) {
    return this.http.delete<{ message: string }>(`${this.endpoint}/${quizId}`, { headers: this.authHeaders() });
  }

  private authHeaders() {
    return new HttpHeaders({ Authorization: `Bearer ${this.authService.getToken() ?? ''}` });
  }
}
