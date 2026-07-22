import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'lc-confirm-modal',
  standalone: true,
  templateUrl: './confirm-modal.component.html',
  styleUrl: './confirm-modal.component.scss',
})
export class ConfirmModalComponent {
  @Input() title = 'Are you sure?';
  @Input() message = 'Are you sure you want to perform this action?';
  @Input() confirmLabel = 'Confirm';
  @Input() cancelLabel = 'Cancel';
  @Input() danger = false;
  @Input() submitting = false;
  @Input() error: string | null = null;

  @Output() confirm = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();

  onOverlayClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) this.cancel.emit();
  }
}
