import { Component, OnInit, ElementRef, ViewChild, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AppointmentsService } from '../../../core/appointments/appointments.service';
import { Appointment, upcomingAppointments, urgency } from '../../../core/appointments/appointments.models';
import { ClaudeService, ChatMessage } from '../../../core/api/claude.service';
import { environment } from '../../../../environments/environment';

interface UiMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  ts: Date;
  error?: boolean;
}

const SUGGESTIONS = [
  'Prepare me for my next appointment',
  'Tell me about my active medications',
  'How do I manage high blood pressure?',
  'What should I know about my blood sugar levels?',
];

@Component({
  selector: 'lc-ai-chat',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './ai-chat.component.html',
  styleUrl: './ai-chat.component.scss',
})
export class AiChatComponent implements OnInit {
  private readonly appointmentsService = inject(AppointmentsService);
  private readonly claude      = inject(ClaudeService);

  @ViewChild('messagesEl') private messagesEl!: ElementRef<HTMLDivElement>;

  readonly hasApiKey   = !!environment.groqApiKey;
  readonly messages    = signal<UiMessage[]>([]);
  readonly isTyping    = signal(false);
  readonly suggestions = SUGGESTIONS;
  inputText = '';

  readonly nextAppt = signal<Appointment | null>(null);

  readonly contextLine = computed(() => {
    const next = this.nextAppt();
    if (!next) return null;
    const u = urgency(next.isoDate);
    const when = u === 'today' ? 'Today' : u === 'tomorrow' ? 'Tomorrow' : `${next.day} ${next.dayNum} ${next.month}`;
    return `${next.provider} · ${when} · ${next.time}`;
  });

  ngOnInit(): void {
    this.appointmentsService.getAppointments().subscribe({
      next: list => {
        this.nextAppt.set(upcomingAppointments(list)[0] ?? null);
      },
    });
  }

  send(text?: string): void {
    const content = (text ?? this.inputText).trim();
    if (!content || this.isTyping()) return;
    this.inputText = '';

    this.addUiMessage('user', content);
    this.isTyping.set(true);

    const history: ChatMessage[] = this.messages().map(m => ({
      role: m.role,
      content: m.text,
    }));

    this.claude.chat(history).subscribe({
      next: reply => {
        this.isTyping.set(false);
        this.addUiMessage('assistant', reply);
      },
      error: (err) => {
        this.isTyping.set(false);
        const msg = err?.status === 429
          ? 'You\'ve sent too many messages in a short time. Please wait a moment and try again.'
          : 'Something went wrong. Please check your connection and try again.';
        this.addUiMessage('assistant', msg, true);
      },
    });
  }

  onKeydown(e: KeyboardEvent): void {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      this.send();
    }
  }

  formatTime(ts: Date): string {
    return ts.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  }

  private addUiMessage(role: 'user' | 'assistant', text: string, error = false): void {
    this.messages.update(msgs => [...msgs, { id: crypto.randomUUID(), role, text, ts: new Date(), error }]);
    setTimeout(() => {
      const el = this.messagesEl?.nativeElement;
      if (el) el.scrollTop = el.scrollHeight;
    }, 30);
  }
}
