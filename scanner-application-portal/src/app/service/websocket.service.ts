import { inject, Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import SockJS from 'sockjs-client';
import { Client, IMessage } from '@stomp/stompjs';
import { EnvService } from './env.service';

// Interfaces
export interface Coordinates {
  unitX: number;
  unitY: number;
  xCoord: number;
  yCoord: number;
}

export interface ScannerStatus {
  state: string;
  currentPosition: Coordinates;
  timestamp: string;
}

export interface ShiftHistoryEntry {
  unitX: number;
  unitY: number;
  xCoord: number;
  yCoord: number;
  timeout: number;
  timestamp: string;
}

export interface ScanHistoryEntry {
  unitX: number;
  unitY: number;
  xCoord: number;
  yCoord: number;
  timestamp: string;
}

@Injectable({
  providedIn: 'root',
})
export class ScannerWebSocketService {
  private stompClient: Client = new Client();
  private envService: any = inject(EnvService);
  private socketUrl = this.envService.socketUrl; // Change to your actual WebSocket endpoint

  // Subjects for state and history
  private state$ = new BehaviorSubject<ScannerStatus | null>(null);
  private shiftHistory$ = new BehaviorSubject<ShiftHistoryEntry[]>([]);
  private scanHistory$ = new BehaviorSubject<ScanHistoryEntry[]>([]);
  private connected$ = new BehaviorSubject<boolean>(false);

  // Observables exposed for components
  public scannerState = this.state$.asObservable();
  public shiftHistory = this.shiftHistory$.asObservable();
  public scanHistory = this.scanHistory$.asObservable();
  public connectionStatus = this.connected$.asObservable();

  constructor() {}

  /**
   * Establish WebSocket connection and subscribe to topics
   */
  public connect(): void {
    if (this.stompClient && this.stompClient.connected) {
      return; // Already connected
    }

    this.stompClient = new Client({
      webSocketFactory: () => new SockJS(this.socketUrl),
      reconnectDelay: 5000,
      debug: () => {}, // Disable debug logs
      onConnect: () => {
        console.log('Connected to scanner WebSocket');
        this.connected$.next(true);

        // Subscribe to scanner state updates
        this.stompClient.subscribe('/topic/scanner/state', (message: IMessage) => {
          const status: ScannerStatus = JSON.parse(message.body);
          this.state$.next(status);
        });

        // Subscribe to shift history updates
        this.stompClient.subscribe('/topic/scanner/shift', (message: IMessage) => {
          const entry: ShiftHistoryEntry = JSON.parse(message.body);
          const current = this.shiftHistory$.value;
          this.shiftHistory$.next([...current, entry]);
        });

        // Subscribe to scan history updates
        this.stompClient.subscribe('/topic/scanner/scan', (message: IMessage) => {
          const entry: ScanHistoryEntry = JSON.parse(message.body);
          const current = this.scanHistory$.value;
          this.scanHistory$.next([...current, entry]);
        });
      },
      onStompError: (frame) => {
        console.error('Broker reported error: ', frame.headers['message']);
        console.error('Details: ', frame.body);
        this.connected$.next(false);
      },
      onWebSocketClose: () => {
        console.warn('WebSocket connection closed');
        this.connected$.next(false);
      },
      onDisconnect: () => {
        console.log('Disconnected from scanner WebSocket');
        this.connected$.next(false);
      },
    });

    this.stompClient.activate();
  }

  /**
   * Disconnect from WebSocket server
   */
  public disconnect(): void {
    if (this.stompClient && this.stompClient.active) {
      this.stompClient.deactivate();
    }
  }

  /**
   * Load initial data from backend REST APIs
   */
  public loadInitialData(shiftHistory: ShiftHistoryEntry[], scanHistory: ScanHistoryEntry[]): void {
    this.shiftHistory$.next(shiftHistory);
    this.scanHistory$.next(scanHistory);
  }

  /**
   * Get current connection status
   */
  public isConnected(): boolean {
    return this.connected$.value;
  }
}
