import { Component, ElementRef, ViewChild, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AppointmentsService, Appointment } from '../appointments/appointments.service';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  ts: Date;
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
export class AiChatComponent {
  private readonly apptService = inject(AppointmentsService);

  @ViewChild('messagesEl') private messagesEl!: ElementRef<HTMLDivElement>;

  readonly messages = signal<ChatMessage[]>([]);
  readonly isTyping = signal(false);

  readonly suggestions = SUGGESTIONS;
  inputText = '';

  readonly nextAppt = computed(() => this.apptService.nextAppointment());

  readonly contextLine = computed(() => {
    const next = this.nextAppt();
    if (!next) return null;
    const u = this.apptService.urgency(next.isoDate);
    const when = u === 'today' ? 'Today' : u === 'tomorrow' ? 'Tomorrow' : `${next.day} ${next.dayNum} ${next.month}`;
    return `${next.provider} · ${when} · ${next.time}`;
  });

  send(text?: string): void {
    const content = (text ?? this.inputText).trim();
    if (!content || this.isTyping()) return;
    this.inputText = '';
    this.addMessage('user', content);
    this.isTyping.set(true);
    const delay = 900 + Math.random() * 700;
    setTimeout(() => {
      this.isTyping.set(false);
      this.addMessage('assistant', this.respond(content));
    }, delay);
  }

  onKeydown(e: KeyboardEvent): void {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      this.send();
    }
  }

  private addMessage(role: 'user' | 'assistant', text: string): void {
    this.messages.update(msgs => [...msgs, { id: crypto.randomUUID(), role, text, ts: new Date() }]);
    setTimeout(() => {
      const el = this.messagesEl?.nativeElement;
      if (el) el.scrollTop = el.scrollHeight;
    }, 30);
  }

  formatTime(ts: Date): string {
    return ts.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  }

  // ── Response logic ─────────────────────────────────────────
  private respond(msg: string): string {
    const q = msg.toLowerCase();
    const next = this.nextAppt();

    if (/\b(hi|hello|hey|good morning|good afternoon|good evening)\b/.test(q)) {
      return this.greet(next);
    }
    if (/\b(prepare|prepared|preparing|bring|ready|what to do|what should i)\b/.test(q)) {
      return this.prepare(next);
    }
    if (/\b(appointment|appointments|next visit|scheduled|upcoming|when is)\b/.test(q)) {
      return this.appointments(next);
    }
    if (/\b(medication|medications|medicine|medicines|pill|pills|drug|drugs|prescription)\b/.test(q)) {
      return this.medications();
    }
    if (/\b(blood pressure|hypertension|lisinopril|systolic|diastolic)\b/.test(q)) {
      return this.bloodPressure(next);
    }
    if (/\b(diabetes|metformin|blood sugar|glucose|hba1c|insulin|sugar level)\b/.test(q)) {
      return this.diabetes(next);
    }
    if (/\b(cholesterol|atorvastatin|statin|lipid|ldl|hdl)\b/.test(q)) {
      return this.cholesterol();
    }
    if (/\b(side effect|side effects|adverse|reaction|allergy)\b/.test(q)) {
      return this.sideEffects();
    }
    if (/\b(remind|reminder|notification|alert|forget)\b/.test(q)) {
      return this.reminders();
    }
    if (/\b(history|past|previous|last visit|last appointment)\b/.test(q)) {
      return this.history();
    }
    if (/\b(thank|thanks|thank you|great|helpful|perfect)\b/.test(q)) {
      return `You're welcome! Your health is what matters most. Feel free to ask anything else — I'm here anytime you need guidance.`;
    }
    return this.general();
  }

  private greet(next: Appointment | null): string {
    const apptLine = next
      ? `I can see your next appointment is with ${next.provider} on ${next.day} ${next.dayNum} ${next.month} at ${next.time}.`
      : `I can see your health summary and upcoming schedule.`;
    return `Hello! I'm your Lucen Health AI assistant. ${apptLine}\n\nI can help you:\n• Prepare for appointments\n• Understand your medications\n• Answer general health questions\n• Track your conditions over time\n\nWhat would you like to know?`;
  }

  private prepare(next: Appointment | null): string {
    if (!next) {
      return `You don't have any upcoming appointments at the moment. When you book one, I'll help you prepare with a personalised checklist.\n\nIn the meantime, it's always good practice to keep an updated list of your symptoms and any changes in how you feel.`;
    }
    const lines = [`Here's how to prepare for your appointment with ${next.provider} (${next.specialty}) on ${next.day} ${next.dayNum} ${next.month} at ${next.time}:\n`];
    if (next.note) lines.push(`📋 Specific note: ${next.note}\n`);
    lines.push(
      `General checklist:\n• Write down any new or worsening symptoms since your last visit\n• Bring a list of all medications you're currently taking (including supplements)\n• Note any questions or concerns you want to raise\n• Arrive 10 minutes early in case of paperwork\n• Bring a form of ID and your insurance card if applicable\n\nWould you like help drafting specific questions to ask ${next.provider}?`
    );
    return lines.join('');
  }

  private appointments(next: Appointment | null): string {
    const upcoming = this.apptService.upcoming();
    if (upcoming.length === 0) {
      return `You have no upcoming appointments scheduled. Head to the Appointments page to book one — I'll send you reminders as the date approaches.`;
    }
    const list = upcoming.slice(0, 3).map(a =>
      `• ${a.day} ${a.dayNum} ${a.month} · ${a.time} — ${a.provider} (${a.specialty})`
    ).join('\n');
    const more = upcoming.length > 3 ? `\n\n…and ${upcoming.length - 3} more. View all on the Appointments page.` : '';
    return `You have ${upcoming.length} upcoming appointment${upcoming.length > 1 ? 's' : ''}:\n\n${list}${more}\n\nYour nearest appointment is with ${next!.provider}. Would you like help preparing for it?`;
  }

  private medications(): string {
    return `You currently have 5 active medications on your plan:\n\n• Metformin 500mg — twice daily (diabetes management)\n• Lisinopril 10mg — once daily (blood pressure)\n• Aspirin 75mg — once daily (cardiovascular protection)\n• Atorvastatin 20mg — once daily (cholesterol management)\n• Vitamin D3 1000IU — once daily (supplement)\n\n2 doses are due at 8:00 PM today — Metformin and Lisinopril. Head to the Medications page to mark them as taken.\n\nWould you like me to explain any of these medications in more detail?`;
  }

  private bloodPressure(next: Appointment | null): string {
    const apptHint = next?.specialty?.toLowerCase().includes('cardio')
      ? `\n\nYour upcoming appointment with ${next.provider} on ${next.dayNum} ${next.month} is a good time to discuss your readings with your cardiologist.`
      : next ? `\n\nMention your readings to ${next.provider} at your upcoming appointment.` : '';
    return `Managing blood pressure well involves several daily habits:\n\n• Take your Lisinopril 10mg consistently — you have a dose due at 8 PM tonight\n• Keep a log of your readings (morning and evening ideally)\n• Reduce salt intake — aim for under 2,300mg of sodium per day\n• Stay physically active — even 30 minutes of walking helps significantly\n• Limit alcohol and manage stress levels\n• Avoid smoking if applicable${apptHint}\n\n⚠️ If you notice readings consistently above 140/90, contact your care team promptly.`;
  }

  private diabetes(next: Appointment | null): string {
    const apptHint = next?.specialty?.toLowerCase().includes('endo')
      ? `\n\nYour appointment with ${next.provider} (${next.specialty}) on ${next.dayNum} ${next.month} includes an HbA1c review — remember to fast for 8 hours beforehand.`
      : '';
    return `Managing blood sugar with type 2 diabetes involves:\n\n• Take Metformin 500mg with food to reduce stomach upset — you have an evening dose today\n• Monitor your carbohydrate intake — consistent meal timing helps stabilise levels\n• Regular light exercise (30 min/day) improves insulin sensitivity\n• Stay well hydrated — dehydration raises blood sugar\n• Avoid sugary drinks and refined carbohydrates${apptHint}\n\nHbA1c target for most people with type 2 diabetes is below 53 mmol/mol (7%). Ask your endocrinologist about your personal target.`;
  }

  private cholesterol(): string {
    return `Your Atorvastatin 20mg helps manage LDL (bad) cholesterol and reduces cardiovascular risk. Here's what supports it:\n\n• Take Atorvastatin at the same time each day — it works best taken consistently\n• Reduce saturated fat: less red meat, full-fat dairy, and processed foods\n• Increase soluble fibre: oats, beans, fruits, and vegetables\n• Regular cardiovascular exercise raises HDL (good) cholesterol\n• Avoid grapefruit juice — it can interfere with how statins are processed\n\nYour next cardiology appointment is a good time to review your latest lipid panel results. Would you like tips on heart-healthy eating?`;
  }

  private sideEffects(): string {
    return `Here's a quick overview of side effects to watch for in your current medications:\n\n• Metformin — nausea or stomach upset (take with food), rarely lactic acidosis (seek urgent care if you feel very unwell)\n• Lisinopril — persistent dry cough (common), dizziness when standing, rarely swelling of face/lips (stop and seek help immediately)\n• Atorvastatin — muscle aches or weakness (report to your doctor), rarely liver issues\n• Aspirin — stomach irritation (take with food), increased bleeding risk\n• Vitamin D3 — usually well tolerated; excess can cause nausea at very high doses\n\n⚠️ Always report any new or unusual symptoms to your healthcare team. Don't stop prescribed medications without medical advice.`;
  }

  private reminders(): string {
    return `Lucen Health keeps you on track with built-in reminders:\n\n• Appointment reminders appear on your dashboard and appointments page when you're within 2 days of a visit\n• Medication tracking lets you mark doses as taken, pending, or skipped\n\nFor push notifications and SMS reminders, that feature is coming soon — we'll let you know when it's available.\n\nIs there a specific appointment or medication you'd like to keep closer track of?`;
  }

  private history(): string {
    const past = this.apptService.past();
    if (past.length === 0) {
      return `No past appointments are recorded yet. Once you've attended visits, they'll appear here and I can help you track patterns in your health history.`;
    }
    const list = past.slice(0, 3).map(a =>
      `• ${a.dayNum} ${a.month} ${a.year} — ${a.provider} (${a.specialty}) · ${a.status}`
    ).join('\n');
    return `Here are your most recent appointments:\n\n${list}\n\nKeeping a consistent appointment history helps your care team spot trends and adjust your treatment. Would you like to book a follow-up for any of these?`;
  }

  private general(): string {
    return `That's a great question. As your health assistant, I can help with:\n\n• Appointment preparation and scheduling\n• Understanding your medications and their purpose\n• General guidance on managing blood pressure, diabetes, and cholesterol\n• Reviewing your health history\n\nFor anything that needs clinical judgement — diagnosis, dosage changes, or urgent symptoms — please contact your care team directly:\n• General concerns → Dr. Sarah Chen\n• Cardiac / BP → Dr. James Obi\n• Diabetes / Endocrine → Dr. Amina Bello\n\nWhat else can I help you with?`;
  }
}
