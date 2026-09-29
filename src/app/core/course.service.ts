import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { AuthService } from './auth.service';

export interface CourseCodeSnippet {
  language: string;
  code: string;
}

export interface CourseTopic {
  title: string;
  content: string;
  codeSnippets: CourseCodeSnippet[];
}

export interface CourseModule {
  title: string;
  topics: CourseTopic[];
}

export interface CourseRecord {
  courseId: string;
  title: string;
  thumbnailImage: string;
  shortDescription: string;
  modules: CourseModule[];
  publishStatus: 'draft' | 'published';
}

interface CoursesResponse {
  data: CourseRecord[];
}

interface CourseResponse {
  data: CourseRecord;
}

@Injectable({ providedIn: 'root' })
export class CourseService {
  private readonly endpoint = 'http://localhost:5000/api/admin/courses';

  constructor(
    private readonly http: HttpClient,
    private readonly authService: AuthService
  ) {}

  getCourses() {
    return this.http.get<CoursesResponse>(this.endpoint, { headers: this.authHeaders() });
  }

  createCourse(formData: FormData) {
    return this.http.post<CourseResponse>(this.endpoint, formData, { headers: this.authHeaders() });
  }

  updateCourse(courseId: string, formData: FormData) {
    return this.http.put<CourseResponse>(`${this.endpoint}/${courseId}`, formData, { headers: this.authHeaders() });
  }

  deleteCourse(courseId: string) {
    return this.http.delete<{ message: string }>(`${this.endpoint}/${courseId}`, { headers: this.authHeaders() });
  }

  private authHeaders() {
    return new HttpHeaders({ Authorization: `Bearer ${this.authService.getToken() ?? ''}` });
  }
}
