import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ApiService } from './api.service';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatReply {
  reply: string;
}

/**
 * Talks to our own backend, which holds the model provider's key and builds the
 * system prompt. This used to call api.groq.com directly with the key in an
 * Authorization header — that shipped the credential to every browser, and only
 * worked at all because of a dev-server proxy that does not exist in a built app.
 *
 * The caller's identity comes from the JWT that authInterceptor attaches, so the
 * patient's name is resolved server-side rather than trusted from the client.
 */
@Injectable({ providedIn: 'root' })
export class ClaudeService {
  private readonly api = inject(ApiService);

  chat(history: ChatMessage[]): Observable<string> {
    return this.api
      .postData<ChatReply>('/ai/chat', { messages: history })
      .pipe(map(res => res.reply));
  }
}
