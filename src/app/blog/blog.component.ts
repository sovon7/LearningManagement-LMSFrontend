import { CommonModule } from '@angular/common';
import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthService } from '../core/auth.service';
import { BlogRecord, BlogService } from '../core/blog.service';

@Component({
  selector: 'app-blog',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './blog.component.html',
  styleUrl: './blog.component.scss'
})
export class BlogComponent {
  readonly blogs = signal<BlogRecord[]>([]);
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly editorOpen = signal(false);
  readonly editingId = signal<string | null>(null);
  readonly expandedBlogId = signal<string | null>(null);
  readonly errorMessage = signal('');
  readonly successMessage = signal('');

  title = '';
  summary = '';
  description = '';
  thumbnailFile: File | null = null;
  thumbnailPreview: string | null = null;

  constructor(
    readonly authService: AuthService,
    private readonly blogService: BlogService
  ) {
    this.loadBlogs();
  }

  get isAdmin(): boolean {
    return this.authService.isAdmin();
  }

  get summaryWordCount(): number {
    return this.countWords(this.summary);
  }

  get descriptionWordCount(): number {
    return this.countWords(this.description);
  }

  loadBlogs(): void {
    this.loading.set(true);
    this.errorMessage.set('');
    this.blogService.getBlogs().subscribe({
      next: ({ data }) => this.blogs.set(data),
      error: (error: HttpErrorResponse) => {
        this.errorMessage.set(this.readError(error, 'Could not load blogs.'));
        this.loading.set(false);
      },
      complete: () => this.loading.set(false)
    });
  }

  openCreate(): void {
    if (this.isAdmin) return;
    this.resetForm();
    this.editorOpen.set(true);
  }

  openEdit(blog: BlogRecord): void {
    if (this.isAdmin || !blog.isOwner) return;
    this.resetForm();
    this.editingId.set(blog.blogId);
    this.title = blog.title;
    this.summary = blog.summary;
    this.description = blog.description;
    this.thumbnailPreview = this.imageUrl(blog.thumbnailImage);
    this.editorOpen.set(true);
    this.expandedBlogId.set(null);
  }

  cancelEditor(): void {
    this.editorOpen.set(false);
    this.resetForm();
  }

  selectThumbnail(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    this.errorMessage.set('');
    if (!file) return;

    const extensions = ['.jpg', '.jpeg', '.png'];
    const extension = file.name.slice(file.name.lastIndexOf('.')).toLowerCase();
    if (!['image/jpeg', 'image/png'].includes(file.type) || !extensions.includes(extension)) {
      input.value = '';
      this.errorMessage.set('Choose a JPG, JPEG, or PNG thumbnail.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      input.value = '';
      this.errorMessage.set('Thumbnail must be 5 MB or smaller.');
      return;
    }

    this.thumbnailFile = file;
    this.thumbnailPreview = URL.createObjectURL(file);
  }

  saveBlog(): void {
    this.errorMessage.set('');
    this.successMessage.set('');
    const validationMessage = this.validateForm();
    if (validationMessage) {
      this.errorMessage.set(validationMessage);
      return;
    }

    const formData = new FormData();
    formData.set('title', this.title.trim());
    formData.set('summary', this.summary.trim());
    formData.set('description', this.description.trim());
    if (this.thumbnailFile) {
      formData.set('thumbnail', this.thumbnailFile);
    }

    const editingId = this.editingId();
    const request = editingId
      ? this.blogService.updateBlog(editingId, formData)
      : this.blogService.createBlog(formData);

    this.saving.set(true);
    request.subscribe({
      next: ({ message }) => {
        this.successMessage.set(message);
        this.editorOpen.set(false);
        this.resetForm();
        this.loadBlogs();
      },
      error: (error: HttpErrorResponse) => {
        this.errorMessage.set(this.readError(error, 'Could not save blog.'));
        this.saving.set(false);
      },
      complete: () => this.saving.set(false)
    });
  }

  deleteBlog(blog: BlogRecord): void {
    const confirmation = this.isAdmin
      ? `Remove "${blog.title}" from the public Blog library?`
      : `Delete your Blog "${blog.title}"?`;
    if (!window.confirm(confirmation)) return;

    this.errorMessage.set('');
    this.successMessage.set('');
    this.blogService.deleteBlog(blog.blogId).subscribe({
      next: ({ message }) => {
        this.successMessage.set(message);
        this.blogs.update((current) => current.filter((item) => item.blogId !== blog.blogId));
        if (this.expandedBlogId() === blog.blogId) this.expandedBlogId.set(null);
      },
      error: (error: HttpErrorResponse) => this.errorMessage.set(this.readError(error, 'Could not delete blog.'))
    });
  }

  toggleDetails(blog: BlogRecord): void {
    this.expandedBlogId.set(this.expandedBlogId() === blog.blogId ? null : blog.blogId);
  }

  imageUrl(imagePath: string): string {
    return imagePath.startsWith('http') ? imagePath : `http://localhost:5000${imagePath}`;
  }

  private validateForm(): string | null {
    if (!this.title.trim()) return 'Enter a Blog title.';
    if (!this.summary.trim() || this.summaryWordCount > 300) return 'Summary is required and must not exceed 300 words.';
    if (this.countWords(this.description) < 550) return 'Explanation must contain at least 550 words.';
    if (!this.editingId() && !this.thumbnailFile) return 'Choose a thumbnail image.';
    return null;
  }

  private countWords(value: string): number {
    return value.trim() ? value.trim().split(/\s+/).length : 0;
  }

  private resetForm(): void {
    this.editingId.set(null);
    this.title = '';
    this.summary = '';
    this.description = '';
    this.thumbnailFile = null;
    this.thumbnailPreview = null;
    this.errorMessage.set('');
  }

  private readError(error: HttpErrorResponse, fallback: string): string {
    return error.error?.message || fallback;
  }
}
