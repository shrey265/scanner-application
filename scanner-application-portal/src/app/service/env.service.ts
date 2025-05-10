// src/app/services/env.service.ts
import { Injectable } from '@angular/core';

interface EnvConfig {
  apiUrl: string;
  socketUrl?: string;
  // add more keys as needed
}

@Injectable({
  providedIn: 'root'
})
export class EnvService {
  private env: EnvConfig;

  constructor() {
    this.env = (window as any).__env || {};
    console.log(this.env)
  }

  get apiUrl(): string {
    return this.env.apiUrl;
  }

  get socketUrl(): string {
    return this.env.socketUrl || '';
  }
}
