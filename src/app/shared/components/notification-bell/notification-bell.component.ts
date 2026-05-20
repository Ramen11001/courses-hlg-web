import { Component, OnInit, OnDestroy, inject, HostListener, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationService } from '../../../core/services/notification.service';
import { Notification } from '../../../core/interfaces/notification';
import { Subscription, interval } from 'rxjs';

@Component({
  selector: 'app-notification-bell',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './notification-bell.component.html',
  styleUrls: ['./notification-bell.component.scss'],
})
export class NotificationBellComponent implements OnInit, OnDestroy {
  private notificationService = inject(NotificationService);
  private refreshSubscription?: Subscription;
  private notificationsSubscription?: Subscription;
  private elementRef = inject(ElementRef);

  notifications: Notification[] = [];
  unviewedCount = 0;
  isOpen = false;

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event) {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.isOpen = false;
    }
  }

  ngOnInit() {
    this.notificationsSubscription = this.notificationService.notifications$.subscribe((notifications) => {
      this.notifications = notifications;
      this.unviewedCount = notifications.filter((n) => !n.viewed).length;
    });
    this.notificationService.loadNotifications();
    this.startPolling();
  }

  ngOnDestroy() {
    this.notificationsSubscription?.unsubscribe();
    this.refreshSubscription?.unsubscribe();
  }

  startPolling() {
    this.refreshSubscription = interval(15000).subscribe(() => {
      this.notificationService.loadNotifications();
    });
  }

  toggleNotifications() {
    this.isOpen = !this.isOpen;
    if (this.isOpen) {
      this.notificationService.loadNotifications();
    }
  }

  markAsViewed(notification: Notification) {
    if (!notification.viewed) {
      this.notificationService.markAsViewed(notification.id).subscribe({
        next: () => {
          notification.viewed = true;
          this.unviewedCount = Math.max(0, this.unviewedCount - 1);
        },
        error: (err) => console.error('Error marking as viewed:', err),
      });
    }
  }

  deleteNotification(event: Event, id: number) {
    event.stopPropagation();
    this.notificationService.deleteNotification(id).subscribe({
      next: () => {
        this.notifications = this.notifications.filter((n) => n.id !== id);
        this.unviewedCount = this.notifications.filter((n) => !n.viewed).length;
      },
      error: (err) => console.error('Error deleting notification:', err),
    });
  }
}
