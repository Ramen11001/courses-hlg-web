import { CommonModule, NgClass } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-user-card',
  standalone: true,
  templateUrl: './user-card.component.html',
  imports: [CommonModule, NgClass],
})
export class UserCardComponent {
  @Input() userItem!: any;
  @Output() onViewProfile = new EventEmitter<number>();

  getInitials(): string {
    if (!this.userItem?.firstName || !this.userItem?.lastName) return 'U';
    return (this.userItem.firstName[0] + this.userItem.lastName[0]).toUpperCase();
  }

  onView(): void {
    this.onViewProfile.emit(this.userItem.id);
  }
}