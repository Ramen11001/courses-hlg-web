import { CommonModule, DecimalPipe, NgClass } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ImageCarouselComponent } from '../../components/image-carousel/image-carousel.component';

@Component({
  selector: 'app-course-card',
  standalone: true,
  templateUrl: './course-card.component.html',
  styleUrls: ['./course-card.component.scss'],
  imports: [CommonModule, NgClass, DecimalPipe, ImageCarouselComponent],
})
export class CourseCardComponent {
  @Input() item!: any;
  @Input() currentUserId!: number | null;
  @Output() onView = new EventEmitter<number>();
  @Output() onEdit = new EventEmitter<number>();
  @Output() onDelete = new EventEmitter<any>();

  stars = [1, 2, 3, 4, 5];

  get images(): string[] {
    return this.item?.images || this.item?.image ? [this.item.image || this.item.images].flat() : [];
  }
}
