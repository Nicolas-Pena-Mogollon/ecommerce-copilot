import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  constructor(private http: HttpClient) {}

  sendTextMessage(message: string) {
    return this.http.post<any>('http://localhost:8000/chat', { message });
  }

  sendVisionMessage(message: string, image: File) {
    const formData = new FormData();
    formData.append('message', message);
    formData.append('image', image);
    return this.http.post<any>('http://localhost:8000/vision', formData);
  }

  getRecommendedProducts() {
    return this.http.get<any[]>('http://localhost:8000/recommend');
  }
}
