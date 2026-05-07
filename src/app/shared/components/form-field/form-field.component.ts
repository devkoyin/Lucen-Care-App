import { Component, Input } from '@angular/core';

@Component({
  selector: 'lc-form-field',
  standalone: true,
  imports: [],
  templateUrl: './form-field.component.html',
  styleUrl: './form-field.component.scss',
})
export class FormFieldComponent {
  @Input({ required: true }) label = '';
  @Input() id = '';
  @Input() error = '';
  @Input() hint = '';
}
