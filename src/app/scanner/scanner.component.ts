import { Component } from '@angular/core';
import { ImageCanvasComponent } from '../image-canvas/image-canvas.component';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-scanner',
  standalone: true,
  imports: [ImageCanvasComponent, CommonModule],
  templateUrl: './scanner.component.html',
  styleUrl: './scanner.component.scss'
})
export class ScannerComponent {
  scannerState: string = 'IDLE';
  shiftTimer: number = 0;
  focusTimer: number = 0;
  totalShift: number = 0;
  finalX: number = 0;
  finalY: number = 0;
  lastX: number = 0;
  lastY: number = 0;

  shiftHistory: any[] = [];
  scanHistory: any[] = [];

  updateCoords(coords: any){
      this.totalShift = Math.abs(coords.unitX-this.lastX) + Math.abs(coords.unitY-this.lastY);
      this.finalX = coords.unitX;
      this.finalY = coords.unitY;
      this.shiftTimer = 3*Math.sqrt(this.totalShift);
      this.moveScanner(coords.unitX, coords.unitY, this.shiftTimer);
  }

  moveScanner(Xcoord: number, Ycoord: number, timeout: number){
    if(this.scannerState == 'MOVING' || this.scannerState =='FOCUS') return;

    this.lastX = Xcoord;
    this.lastY = Ycoord;
    this.scannerState ='MOVING';
    this.shiftTimer = 0; // reset shiftimer
    this.totalShift = 0; 
    console.log("shift in progress", timeout);

    const interval = setTimeout(() => {
      console.log("finish");
      this.scannerState = 'IDLE';
      this.shiftHistory.push({'x': this.roundTo(Xcoord,2), 'y': this.roundTo(Ycoord,2)});
      if(this.shiftTimer>0){
        this.moveScanner(this.finalX, this.finalY, this.shiftTimer);
      } else{
        this.focusImage(Xcoord, Ycoord);
      }

    }, timeout*1000); 
  }


  focusImage(Xcoord: number, Ycoord: number){
    this.scannerState = 'FOCUS';
    const interval = setTimeout(() => {
      this.scannerState = 'READY';
      this.scanHistory.push({'x': this.roundTo(Xcoord,2), 'y': this.roundTo(Ycoord,2)})
    }, 2000); 
  }

  roundTo(value: number, decimals: number): number {
    return Math.round(value * Math.pow(10, decimals)) / Math.pow(10, decimals);
  }

}
