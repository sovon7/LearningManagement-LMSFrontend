import { CommonModule } from '@angular/common';
import { Component, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-feature-placeholder',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './feature-placeholder.component.html',
  styleUrl: './feature-placeholder.component.scss'
})
export class FeaturePlaceholderComponent {
  readonly featureName = signal('Feature');

  constructor(route: ActivatedRoute) {
    route.data.subscribe((data) => this.featureName.set(String(data['featureName'] || 'Feature')));
  }
}
