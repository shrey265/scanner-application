package com.morphle.scanner_application.dto;


import java.time.LocalDateTime;

public class ScannerStatus {
    private String state;
    private Coordinates currentPosition;
    private LocalDateTime timestamp;

    public ScannerStatus() {
        this.timestamp = LocalDateTime.now();
    }

    public ScannerStatus(String state, Coordinates currentPosition) {
        this.state = state;
        this.currentPosition = currentPosition;
        this.timestamp = LocalDateTime.now();
    }

    public String getState() {
        return state;
    }

    public void setState(String state) {
        this.state = state;
    }

    public Coordinates getCurrentPosition() {
        return currentPosition;
    }

    public void setCurrentPosition(Coordinates currentPosition) {
        this.currentPosition = currentPosition;
    }

    public LocalDateTime getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(LocalDateTime timestamp) {
        this.timestamp = timestamp;
    }
}