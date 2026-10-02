import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { AuthService } from './auth.service';

export interface BlogRecord {
  blogId: string;
  title: string;
  thumbnailImage: string;
  summary: string;
  description: string;
  published: boolean;
  authorName: string;
  isOwner: boolean;
  createdAt: string;
  updatedAt: string;
}

interface BlogListResponse {
  data: BlogRecord[];
}

interface BlogResponse {
  data: BlogRecord;
  message: string;
}

@Injectable({ providedIn: 'root' })
export class BlogService {
  private readonly endpoint = 'http://localhost:5000/api/blogs';

  constructor(
    private readonly http: HttpClient,
    private readonly authService: AuthService
  ) {}

  getBlogs() {
    return this.http.get<BlogListResponse>(this.endpoint, { headers: this.authHeaders() });
  }

  createBlog(formData: FormData) {
    return this.http.post<BlogResponse>(this.endpoint, formData, { headers: this.authHeaders() });
  }

  updateBlog(blogId: string, formData: FormData) {
    return this.http.put<BlogResponse>(`${this.endpoint}/${blogId}`, formData, { headers: this.authHeaders() });
  }

  deleteBlog(blogId: string) {
    return this.http.delete<{ message: string }>(`${this.endpoint}/${blogId}`, { headers: this.authHeaders() });
  }

  private authHeaders() {
    return new HttpHeaders({ Authorization: `Bearer ${this.authService.getToken() ?? ''}` });
  }
}
