import { Component } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';

@Component({
  selector: 'lc-public-shell',
  standalone: true,
  imports: [RouterOutlet, RouterLink],
  templateUrl: './public-shell.component.html',
  styleUrl: './public-shell.component.scss',
})
export class PublicShellComponent {}
