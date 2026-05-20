import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Notification } from '../interfaces/notification';

@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  private baseUrl = `${environment.baseUrl}/notifications`;
  private http = inject(HttpClient);
  private notificationsSubject = new BehaviorSubject<Notification[]>([]);

  notifications$ = this.notificationsSubject.asObservable();

  loadNotifications(): void {
    this.http.get<Notification[]>(this.baseUrl).subscribe({
      next: (notifications) => this.notificationsSubject.next(notifications),
      error: (err) => console.error('[NotificationService] Error loading notifications:', err),
    });
  }

  markAsViewed(id: number): Observable<Notification> {
    return this.http.put<Notification>(`${this.baseUrl}/${id}/viewed`, {});
  }

  deleteNotification(id: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/${id}`);
  }
}
