import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Course } from '../interfaces/course';

@Injectable({
  providedIn: 'root',
})
export class RecommendationService {
  private baseUrl = `${environment.baseUrl}/recommendations`;
  private http = inject(HttpClient);

  getSuggestions(): Observable<Course[]> {
    return this.http.get<Course[]>(this.baseUrl);
  }
}
