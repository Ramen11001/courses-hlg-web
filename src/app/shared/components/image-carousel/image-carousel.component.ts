import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-image-carousel',
  standalone: true,
  templateUrl: './image-carousel.component.html',
  styleUrls: ['./image-carousel.component.scss'],
  imports: [CommonModule],
})
export class ImageCarouselComponent {
  @Input() images: string[] = [];
  @Input() height = '200px';
  @Input() rounded = true;

  currentIndex = 0;

  get hasImages(): boolean {
    return this.images && this.images.length > 0;
  }

  get showControls(): boolean {
    return this.images && this.images.length > 1;
  }

  next(): void {
    if (this.images.length <= 1) return;
    this.currentIndex = (this.currentIndex + 1) % this.images.length;
  }

  prev(): void {
    if (this.images.length <= 1) return;
    this.currentIndex = (this.currentIndex - 1 + this.images.length) % this.images.length;
  }

  goTo(index: number): void {
    this.currentIndex = index;
  }
}
