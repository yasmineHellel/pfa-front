import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface ChatMessage {
  role: 'user' | 'bot';
  text: string;
  time: string;
}

@Injectable({ providedIn: 'root' })
export class ChatbotService {
  private readonly url = `${environment.vehicleUrl}/chatbot/message`;

  constructor(private http: HttpClient) {}

  sendMessage(message: string): Observable<{ reply: string }> {
    return this.http.post<{ reply: string }>(this.url, { message });
  }
}
