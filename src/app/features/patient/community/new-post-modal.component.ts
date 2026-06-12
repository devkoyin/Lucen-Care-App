import { Component, EventEmitter, Output } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { ColorSelectComponent, ColorSelectOption } from '../appointments/color-select.component';

export interface NewPostData {
  groupId: string;
  groupLabel: string;
  groupColor: string;
  title: string;
  content: string;
  tags: string[];
}

const GROUP_OPTIONS = [
  { id: 'diabetes',     label: 'Diabetes Support',    color: '#D97706' },
  { id: 'heart',        label: 'Heart Health',         color: '#DC2626' },
  { id: 'hypertension', label: 'Hypertension Hub',     color: '#7C3AED' },
  { id: 'wellness',     label: 'General Wellness',     color: '#059669' },
  { id: 'nutrition',    label: 'Nutrition & Diet',     color: '#0D9488' },
  { id: 'mental',       label: 'Mental Wellness',      color: '#4F46E5' },
];

@Component({
  selector: 'lc-new-post-modal',
  standalone: true,
  imports: [FormsModule, ColorSelectComponent],
  templateUrl: './new-post-modal.component.html',
  styleUrl: './new-post-modal.component.scss',
})
export class NewPostModalComponent {
  @Output() close = new EventEmitter<void>();
  @Output() posted = new EventEmitter<NewPostData>();

  readonly groupSelectOptions: ColorSelectOption[] = GROUP_OPTIONS.map(g => ({
    value: g.label,
    accent: g.color,
  }));

  form = {
    groupLabel: '',
    title: '',
    content: '',
    tagsRaw: '',
  };

  onOverlayClick(e: MouseEvent): void {
    if ((e.target as HTMLElement).classList.contains('npm-overlay')) {
      this.close.emit();
    }
  }

  submit(f: NgForm): void {
    if (f.invalid || !this.form.groupLabel) return;
    const group = GROUP_OPTIONS.find(g => g.label === this.form.groupLabel)!;
    const tags = this.form.tagsRaw
      .split(',')
      .map(t => t.trim().replace(/^#/, ''))
      .filter(t => t.length > 0);

    this.posted.emit({
      groupId: group.id,
      groupLabel: group.label,
      groupColor: group.color,
      title: this.form.title.trim(),
      content: this.form.content.trim(),
      tags,
    });
    this.close.emit();
  }
}
