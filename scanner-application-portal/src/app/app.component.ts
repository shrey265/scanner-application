import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ImageCanvasComponent } from './image-canvas/image-canvas.component';
import { ScannerComponent } from './scanner/scanner.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, ScannerComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'scanner-application';
}
