import { Component, Input } from '@angular/core';

@Component({
  selector: 'lc-calendar-icon',
  standalone: true,
  template: `
    <span class="calendar-icon" [class.calendar-icon--muted]="muted"
          [style.width.px]="size" [style.height.px]="size" aria-hidden="true">
      <span class="calendar-icon__day" [style.fontSize.px]="dayFontSize">{{ day }}</span>
    </span>
  `,
  styleUrl: './calendar-icon.component.scss',
})
export class CalendarIconComponent {
  @Input() day: number = new Date().getDate();
  @Input() size = 22;
  @Input() muted = false;

  get dayFontSize(): number {
    return Math.max(9, Math.round(this.size * 0.5));
  }
}
