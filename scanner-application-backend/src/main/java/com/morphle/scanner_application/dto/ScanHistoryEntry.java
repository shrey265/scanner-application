package com.morphle.scanner_application.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class ScanHistoryEntry {
    private double x;
    private double y;
    private double xCoord;
    private double yCoord;
    private LocalDateTime timestamp;

    public ScanHistoryEntry(double x, double y, double xCoord, double yCoord) {
        this.x = x;
        this.y = y;
        this.xCoord = xCoord;
        this.yCoord = yCoord;
    }
}