import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, map, tap, catchError, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface GroqResponse {
  choices: Array<{
    message: { role: string; content: string };
  }>;
}

const SYSTEM_PROMPT = `You are Lucen Health AI, a compassionate and knowledgeable health assistant built into the Lucen Care patient portal in Nigeria. You help patients understand their health conditions, medications, appointment preparation, and care plans.

Be warm, clear, and concise. Use bullet points for lists. Avoid jargon. Always encourage patients to consult their healthcare team for clinical decisions — never diagnose or recommend dosage changes. Keep responses under 250 words unless the question genuinely requires more detail.`;

@Injectable({ providedIn: 'root' })
export class ClaudeService {
  private readonly http = inject(HttpClient);

  chat(history: ChatMessage[]): Observable<string> {
    const headers = new HttpHeaders({
      'content-type': 'application/json',
      'Authorization': `Bearer ${environment.groqApiKey}`,
    });

    const messages = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...history.map(m => ({ role: m.role, content: m.content })),
    ];

    return this.http.post<GroqResponse>(
      '/groq-api/openai/v1/chat/completions',
      {
        model: 'llama-3.1-8b-instant',
        messages,
        max_tokens: 1024,
      },
      { headers }
    ).pipe(
      tap({ error: err => console.error('[Groq] error:', err.status, err.error) }),
      map(res => res.choices[0]?.message?.content ?? 'Sorry, I could not generate a response right now.'),
      catchError(err => throwError(() => err))
    );
  }
}
