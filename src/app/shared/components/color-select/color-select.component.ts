import { Component, ElementRef, EventEmitter, HostListener, Input, Output, inject, signal } from '@angular/core';

export interface ColorSelectOption {
  value: string;
  accent: string;
  bg?: string;
}

@Component({
  selector: 'lc-color-select',
  standalone: true,
  templateUrl: './color-select.component.html',
  styleUrl: './color-select.component.scss',
})
export class ColorSelectComponent {
  @Input() options: ColorSelectOption[] = [];
  @Input() value = '';
  @Input() placeholder = 'Select an option';
  @Output() valueChange = new EventEmitter<string>();

  readonly open = signal(false);
  private readonly el = inject(ElementRef);

  @HostListener('document:click', ['$event'])
  onDocumentClick(e: MouseEvent): void {
    if (!this.el.nativeElement.contains(e.target as Node)) {
      this.open.set(false);
    }
  }

  toggle(e: MouseEvent): void {
    e.stopPropagation();
    this.open.update(v => !v);
  }

  select(opt: ColorSelectOption): void {
    this.valueChange.emit(opt.value);
    this.open.set(false);
  }

  selected(): ColorSelectOption | undefined {
    return this.options.find(o => o.value === this.value);
  }
}
