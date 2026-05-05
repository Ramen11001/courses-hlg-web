import { CommonModule, NgClass } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ImageCarouselComponent } from '../../components/image-carousel/image-carousel.component';

@Component({
  selector: 'app-user-card',
  standalone: true,
  templateUrl: './user-card.component.html',
  styleUrls: ['./user-card.component.scss'],
  imports: [CommonModule, NgClass, ImageCarouselComponent],
})
export class UserCardComponent {
  @Input() userItem!: any;
  @Output() onViewProfile = new EventEmitter<number>();

  getInitials(): string {
    if (!this.userItem?.firstName || !this.userItem?.lastName) return 'U';
    return (this.userItem.firstName[0] + this.userItem.lastName[0]).toUpperCase();
  }

  get images(): string[] {
    return this.userItem?.images || this.userItem?.image ? [this.userItem.image || this.userItem.images].flat() : [];
  }

  onView(): void {
    this.onViewProfile.emit(this.userItem.id);
  }
}