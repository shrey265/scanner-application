import { Component, inject, OnInit } from '@angular/core';
import { ImageCanvasComponent } from '../image-canvas/image-canvas.component';
import { CommonModule } from '@angular/common';
import { StorageService } from '../service/storage.service';

@Component({
  selector: 'app-scanner',
  standalone: true,
  imports: [ImageCanvasComponent, CommonModule],
  templateUrl: './scanner.component.html',
  styleUrl: './scanner.component.scss'
})

export class ScannerComponent implements OnInit {
  // state
  scannerState: string = 'IDLE';
  
  // timer
  shiftTimer: number = 0;
  focusTimer: number = 0;

  // shift
  totalShift: number = 0;
  
  // coords
  finalCoords: any;
  finalX: number = 0;
  finalY: number = 0;
  lastX: number = 0;
  lastY: number = 0;

  // store history
  shiftHistory: any[] = [];
  scanHistory: any[] = [];

  private storageService: StorageService = inject(StorageService);


  ngOnInit(): void {
    if(this.shiftHistory.length==0 && this.storageService.getItem("shiftHistory")) this.shiftHistory = this.storageService.getItem("shiftHistory") as any[];
    if(this.scanHistory.length==0 && this.storageService.getItem("scanHistory")) this.scanHistory = this.storageService.getItem("scanHistory") as any[];
    if(this.storageService.getItem("state")) this.scannerState=this.storageService.getItem("state") as string;
  }


  // this function finds the total shift from the last moved coordinate to the latest keypress coordinates
  updateCoords(coords: any){
      this.totalShift = Math.abs(coords.unitX-this.lastX) + Math.abs(coords.unitY-this.lastY);
      this.finalCoords = coords;
      this.shiftTimer = 3*Math.sqrt(this.totalShift);
      this.moveScanner(coords, this.shiftTimer);
  }

  // this function is responsible to move the scanner
  // once the shift is completed
  // it looks if theres another some shift is pending
  // otherwise it call focus image after 20ms
  moveScanner(coords: any, timeout: number){
    if(this.scannerState == 'MOVING' || this.scannerState =='FOCUS') return;

    this.lastX = coords.unitX;
    this.lastY = coords.unitY;
    this.scannerState ='MOVING';
    this.shiftTimer = 0; // reset shiftimer
    this.totalShift = 0; 
    console.log("shift in progress", timeout);

    const interval = setTimeout(() => {
      this.scannerState = 'IDLE';
      this.shiftHistory.push({'x': this.roundTo(coords.unitX,2), 'y': this.roundTo(coords.unitY,2), 'xCoord': coords.xCoord, 'yCoord': coords.yCoord, 'time': this.roundTo(timeout,2)});
      this.storageService.setItem("shiftHistory", this.shiftHistory);
      if(this.shiftTimer>0){
        this.moveScanner(this.finalCoords, this.shiftTimer);
      } else{
        setTimeout(() => {
          this.focusImage(coords);
        }, 20); // 20ms timer
      }

    }, timeout*1000); 
  }


  focusImage(coords: any){
    this.scannerState = 'FOCUS';
    const interval = setTimeout(() => {
      this.scannerState = 'READY';
      this.scanHistory.push({'x': this.roundTo(coords.unitX,2), 'y': this.roundTo(coords.unitY,2), 'xCoord': coords.xCoord, 'yCoord': coords.yCoord});
      this.storageService.setItem("scanHistory", this.scanHistory);
      this.storageService.setItem("state", "READY");
      if(this.shiftTimer>0){
        this.moveScanner(this.finalCoords, this.shiftTimer);
      }
    }, 2000); 
  }

  roundTo(value: number, decimals: number): number {
    return Math.round(value * Math.pow(10, decimals)) / Math.pow(10, decimals);
  }

  clearState(){
    this.storageService.clear();
  }

}
