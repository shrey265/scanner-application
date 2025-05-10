import { Component, inject, OnInit } from '@angular/core';
import { ImageCanvasComponent } from '../image-canvas/image-canvas.component';
import { CommonModule } from '@angular/common';
import { StorageService } from '../service/storage.service';
import { HttpService } from '../service/http.service';
import { ScannerStatus, ScannerWebSocketService } from '../service/websocket.service';
import { Subscription } from 'rxjs';
import { EnvService } from '../service/env.service';

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

  currentStatus: ScannerStatus | null = null;
  isConnected = false;

  private httpService: HttpService = inject(HttpService);
  private scannerWebSocketService: ScannerWebSocketService = inject(ScannerWebSocketService);
  private envService: any = inject(EnvService);
  private apiUrl = this.envService.apiUrl;
  // Subscriptions that need to be cleaned up
  private subscriptions: Subscription[] = [];

  ngOnInit(): void {
    this.scannerWebSocketService.connect();   
    this.subscriptions.push(
      this.scannerWebSocketService.scannerState.subscribe(
        status => {
          this.currentStatus = status;
          this.scannerState = this.currentStatus?.state || 'IDLE';
        }
      )
    );
    this.subscriptions.push(
      this.scannerWebSocketService.shiftHistory.subscribe(
        (history: any) => {
          this.shiftHistory = history[history.length - 1];
        }
      )
    );
    this.subscriptions.push(
      this.scannerWebSocketService.scanHistory.subscribe(
        (history: any) => {
          this.scanHistory = history[history.length - 1];
        }
      )
    );
    this.subscriptions.push(
      this.scannerWebSocketService.connectionStatus.subscribe(
        status => this.isConnected = status
      )
    );
    // Load initial state data from the server 
    this.loadInitialData();
  }


  loadInitialData(): void {
    // Get scanner state
    this.httpService.get(`${this.apiUrl}/state`).subscribe(
      (response: any) => {
        if (!this.currentStatus) {
          this.currentStatus = {
            state: response.state,
            currentPosition: { unitX: 0, unitY: 0, xCoord: 0, yCoord: 0 },
            timestamp: new Date().toISOString()
          };
        }
        this.scannerState = this.currentStatus?.state || 'IDLE';
      }
    );


    this.httpService.get(`${this.apiUrl}/history/shift`).subscribe(
      (response: any) => {
        this.shiftHistory = response || [];
      }
    );

    this.httpService.get(`${this.apiUrl}/history/scan`).subscribe(
      (response: any) => {
        this.scanHistory = response || [];
      }
    );

  }


  // this function finds the total shift from the last moved coordinate to the latest keypress coordinates
  updateCoords(coords: any){
    coords.xCoord = this.roundTo(coords.xCoord, 2);
    coords.yCoord = this.roundTo(coords.yCoord, 2);
    this.httpService.post(`${this.apiUrl}/move`, coords).subscribe(response => {
    });
  }

  // // this function is responsible to move the scanner
  // // once the shift is completed
  // // it looks if theres another some shift is pending
  // // otherwise it call focus image after 20ms
  // moveScanner(coords: any, timeout: number){
  //   if(this.scannerState == 'MOVING' || this.scannerState =='FOCUS') return;

  //   this.lastX = coords.unitX;
  //   this.lastY = coords.unitY;
  //   this.scannerState ='MOVING';
  //   this.shiftTimer = 0; // reset shiftimer
  //   this.totalShift = 0; 
  //   console.log("shift in progress", timeout);

  //   const interval = setTimeout(() => {
  //     this.scannerState = 'IDLE';
  //     this.shiftHistory.push({'x': this.roundTo(coords.unitX,2), 'y': this.roundTo(coords.unitY,2), 'xCoord': coords.xCoord, 'yCoord': coords.yCoord, 'time': this.roundTo(timeout,2)});
  //     this.storageService.setItem("shiftHistory", this.shiftHistory);
  //     if(this.shiftTimer>0){
  //       this.moveScanner(this.finalCoords, this.shiftTimer);
  //     } else{
  //       setTimeout(() => {
  //         this.focusImage(coords);
  //       }, 20); // 20ms timer
  //     }

  //   }, timeout*1000); 
  // }


  // focusImage(coords: any){
  //   this.scannerState = 'FOCUS';
  //   const interval = setTimeout(() => {
  //     this.scannerState = 'READY';
  //     this.scanHistory.push({'x': this.roundTo(coords.unitX,2), 'y': this.roundTo(coords.unitY,2), 'xCoord': coords.xCoord, 'yCoord': coords.yCoord});
  //     this.storageService.setItem("scanHistory", this.scanHistory);
  //     this.storageService.setItem("state", "READY");
  //     if(this.shiftTimer>0){
  //       this.moveScanner(this.finalCoords, this.shiftTimer);
  //     }
  //   }, 2000); 
  // }

  roundTo(value: number, decimals: number): number {
    return Math.round(value * Math.pow(10, decimals)) / Math.pow(10, decimals);
  }

  clearState(){
    // this.storageService.clear();
    this.httpService.post(`${this.apiUrl}/reset`,{}).subscribe(response => {});
    window.location.reload();
  }

}
