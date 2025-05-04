import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class StorageService {

  constructor() {}

  // Set a string or object in localStorage
  setItem(key: string, value: any): void {
    const jsonValue = JSON.stringify(value);
    localStorage.setItem(key, jsonValue);
  }

  // Get a value from localStorage
  getItem<T>(key: string): T | null {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) as T : null;
  }

  // Remove a specific item
  removeItem(key: string): void {
    localStorage.removeItem(key);
  }

  // Clear all localStorage
  clear(): void {
    localStorage.clear();
    window.location.reload();
  }
}
