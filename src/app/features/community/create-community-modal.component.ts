import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';

export interface CreateCommunityData {
  name: string;
  icon: string;
  accent: string;
  description?: string;
}

const ICON_OPTIONS = [
  '🌟', '💪', '🏃', '🧘', '🍎', '🫀', '🧬', '🔬',
  '💧', '☀️', '🌙', '🦷', '🦴', '🌺', '👣', '💤',
  '🌈', '⚡', '🧠', '❤️‍🩹',
];

const ACCENT_OPTIONS = [
  '#059669', '#2563EB', '#7C3AED', '#DC2626',
  '#D97706', '#0D9488', '#DB2777', '#4F46E5',
];

@Component({
  selector: 'lc-create-community-modal',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './create-community-modal.component.html',
  styleUrl: './create-community-modal.component.scss',
})
export class CreateCommunityModalComponent {
  @Input() submitting = false;
  @Input() error: string | null = null;

  @Output() close = new EventEmitter<void>();
  @Output() created = new EventEmitter<CreateCommunityData>();

  readonly iconOptions = ICON_OPTIONS;
  readonly accentOptions = ACCENT_OPTIONS;

  form = {
    name: '',
    icon: '',
    accent: ACCENT_OPTIONS[0],
    description: '',
  };

  get isValid(): boolean {
    return !!(this.form.name.trim() && this.form.icon);
  }

  selectIcon(icon: string): void {
    this.form.icon = icon;
  }

  selectAccent(accent: string): void {
    this.form.accent = accent;
  }

  submit(f: NgForm): void {
    if (f.invalid || !this.isValid || this.submitting) return;
    this.created.emit({
      name: this.form.name.trim(),
      icon: this.form.icon,
      accent: this.form.accent,
      description: this.form.description.trim() || undefined,
    });
    // Deliberately does NOT close: a rejected create would otherwise discard
    // everything typed. The parent closes it once the API accepts.
  }

  onOverlayClick(e: MouseEvent): void {
    if (e.target === e.currentTarget) this.close.emit();
  }
}
