import { CommonModule } from '@angular/common';
import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthService } from '../../core/auth.service';
import { CourseRecord, CourseService, CourseTopic } from '../../core/course.service';

type EditableTopic = Omit<CourseTopic, '_id'>;

@Component({
  selector: 'app-admin-courses',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './course.component.html',
  styleUrl: './course.component.scss'
})
export class CourseComponent {
  readonly courses = signal<CourseRecord[]>([]);
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly viewMode = signal<'library' | 'editor'>('library');
  readonly editingId = signal<string | null>(null);

  title = '';
  shortDescription = '';
  topics: EditableTopic[] = [this.createTopic()];
  selectedTopicIndex = 0;
  thumbnailFile: File | null = null;
  thumbnailPreview: string | null = null;
  errorMessage = '';
  successMessage = '';

  constructor(
    readonly authService: AuthService,
    private readonly courseService: CourseService,
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
    this.loadCourses();
  }

  get shortDescriptionCharacterCount(): number {
    return this.shortDescription.length;
  }

  loadCourses(): void {
    this.loading.set(true);
    this.errorMessage = '';
    this.courseService.getCourses().subscribe({
      next: ({ data }) => this.courses.set(data),
      error: (error: HttpErrorResponse) => {
        this.errorMessage = this.readError(error, 'Could not load courses.');
        this.loading.set(false);
      },
      complete: () => this.loading.set(false)
    });
  }

  openCreate(): void {
    this.resetForm();
    this.viewMode.set('editor');
  }

  openEdit(course: CourseRecord): void {
    this.resetForm();
    this.editingId.set(course.courseId);
    this.title = course.title;
    this.shortDescription = course.shortDescription;
    this.topics = course.modules.flatMap((courseModule) =>
      courseModule.topics.map((topic) => ({
        title: topic.title,
        content: topic.content,
        codeSnippets: (topic.codeSnippets ?? []).map((snippet) => ({ ...snippet }))
      }))
    );
    if (!this.topics.length) {
      this.topics = [this.createTopic()];
    }
    this.selectedTopicIndex = 0;
    this.thumbnailPreview = this.imageUrl(course.thumbnailImage);
    this.viewMode.set('editor');
  }

  cancelEdit(): void {
    this.viewMode.set('library');
    this.resetForm();
  }

  onThumbnailSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    this.errorMessage = '';
    if (!file) {
      return;
    }

    const allowedTypes = ['image/jpeg', 'image/png'];
    const allowedExtensions = ['.jpg', '.jpeg', '.png'];
    const extension = file.name.slice(file.name.lastIndexOf('.')).toLowerCase();
    if (!allowedTypes.includes(file.type) || !allowedExtensions.includes(extension)) {
      input.value = '';
      this.errorMessage = 'Choose a JPG, JPEG, or PNG image.';
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      input.value = '';
      this.errorMessage = 'The thumbnail must be 5 MB or smaller.';
      return;
    }

    this.thumbnailFile = file;
    this.thumbnailPreview = URL.createObjectURL(file);
  }

  addTopic(): void {
    this.topics = [...this.topics, this.createTopic()];
    this.selectTopic(this.topics.length - 1);
  }

  removeTopic(topicIndex: number): void {
    const topics = [...this.topics];
    if (topics.length > 1) {
      topics.splice(topicIndex, 1);
      this.topics = topics;
      if (this.selectedTopicIndex === topicIndex) {
        this.selectTopic(Math.min(topicIndex, topics.length - 1));
      } else if (this.selectedTopicIndex > topicIndex) {
        this.selectTopic(this.selectedTopicIndex - 1);
      }
    }
  }

  selectTopic(topicIndex: number): void {
    this.selectedTopicIndex = topicIndex;
  }

  addCodeSnippet(topicIndex: number): void {
    this.topics[topicIndex].codeSnippets.push({ language: 'text', code: '' });
  }

  removeCodeSnippet(topicIndex: number, snippetIndex: number): void {
    this.topics[topicIndex].codeSnippets.splice(snippetIndex, 1);
  }

  saveCourse(): void {
    this.errorMessage = '';
    this.successMessage = '';
    const validationMessage = this.validateForm();
    if (validationMessage) {
      this.errorMessage = validationMessage;
      return;
    }

    const formData = new FormData();
    formData.append('title', this.title.trim());
    formData.append('shortDescription', this.shortDescription.trim());
    formData.append('modules', JSON.stringify([{ title: 'Main course', topics: this.topics }]));
    if (this.thumbnailFile) {
      formData.append('thumbnail', this.thumbnailFile);
    }

    this.saving.set(true);
    const editingId = this.editingId();
    const request = editingId
      ? this.courseService.updateCourse(editingId, formData)
      : this.courseService.createCourse(formData);

    request.subscribe({
      next: () => {
        this.successMessage = editingId ? 'Course updated.' : 'Course created.';
        this.viewMode.set('library');
        this.resetForm();
        this.loadCourses();
      },
      error: (error: HttpErrorResponse) => {
        this.errorMessage = this.readError(error, 'Could not save the course.');
        this.saving.set(false);
      },
      complete: () => this.saving.set(false)
    });
  }

  deleteCourse(course: CourseRecord): void {
    if (!window.confirm(`Delete "${course.title}"? This cannot be undone.`)) {
      return;
    }

    this.errorMessage = '';
    this.successMessage = '';
    this.courseService.deleteCourse(course.courseId).subscribe({
      next: ({ message }) => {
        this.successMessage = message;
        this.courses.update((current) => current.filter((item) => item.courseId !== course.courseId));
      },
      error: (error: HttpErrorResponse) => this.errorMessage = this.readError(error, 'Could not delete the course.')
    });
  }

  imageUrl(imagePath: string): string {
    return imagePath.startsWith('http') ? imagePath : `http://localhost:5000${imagePath}`;
  }

  topicCount(course: CourseRecord): number {
    return course.modules.reduce((total, courseModule) => total + courseModule.topics.length, 0);
  }

  trackByIndex(index: number): number {
    return index;
  }

  private validateForm(): string | null {
    if (!this.title.trim()) {
      return 'Enter a course title.';
    }
    if (!this.shortDescription.trim()) {
      return 'Enter a short description.';
    }
    if (this.shortDescriptionCharacterCount > 1000) {
      return 'The short description cannot exceed 1,000 characters.';
    }
    if (!this.editingId() && !this.thumbnailFile) {
      return 'Choose a course thumbnail.';
    }
    if (!this.topics.length) {
      return 'Add at least one topic to the main course.';
    }

    for (const [topicIndex, topic] of this.topics.entries()) {
      if (!topic.title.trim() || !topic.content.trim()) {
        return `Add a title and detailed content to topic ${topicIndex + 1}.`;
      }
      if (topic.codeSnippets.some((snippet) => !snippet.code.trim())) {
        return `Complete or remove the empty code example in topic ${topicIndex + 1}.`;
      }
    }
    return null;
  }

  private createTopic(): EditableTopic {
    return { title: '', content: '', codeSnippets: [] };
  }

  private resetForm(): void {
    this.editingId.set(null);
    this.title = '';
    this.shortDescription = '';
    this.topics = [this.createTopic()];
    this.selectedTopicIndex = 0;
    this.thumbnailFile = null;
    this.thumbnailPreview = null;
    this.errorMessage = '';
  }

  private readError(error: HttpErrorResponse, fallback: string): string {
    return error.error?.message || fallback;
  }
}
