import { Component, Input } from '@angular/core';

@Component({
  selector: 'lc-form-field',
  standalone: true,
  imports: [],
  templateUrl: './form-field.component.html',
  styleUrl: './form-field.component.scss',
  // `id` is a static attribute at every call site, so Angular both binds the @Input
  // and leaves the attribute on this host — giving two elements the same id and
  // pointing every <label for> at the wrapper instead of the control inside it.
  // Stripping it here fixes label-click focus everywhere without touching templates.
  host: { '[attr.id]': 'null' },
})
export class FormFieldComponent {
  @Input({ required: true }) label = '';
  @Input() id = '';
  @Input() error = '';
  @Input() hint = '';
  /** Shows the required marker. Purely presentational — validation stays on the form. */
  @Input() required = false;
}
