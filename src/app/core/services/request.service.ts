import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class RequestService {
  private baseUrl = `${environment.baseUrl}/requests`;

  constructor(private http: HttpClient) {}

  createRequest(type: string, message: string): Observable<any> {
    return this.http.post(this.baseUrl, { type, message });
  }

  getAllRequests(): Observable<any[]> {
    return this.http.get<any[]>(this.baseUrl);
  }

  getPendingRequests(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/pending`);
  }

  getMyRequests(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/my-requests`);
  }

  reviewRequest(id: number, status: string, review_message?: string): Observable<any> {
    return this.http.put(`${this.baseUrl}/${id}/review`, { status, review_message });
  }
}
