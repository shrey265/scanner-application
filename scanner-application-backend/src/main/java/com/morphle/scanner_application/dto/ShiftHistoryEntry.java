package com.morphle.scanner_application.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ShiftHistoryEntry {
    private double x;
    private double y;
    private double xCoord;
    private double yCoord;
    private double timeout;
    private LocalDateTime timestamp;

    public ShiftHistoryEntry(double x, double y, double xCoord, double yCoord, double timeout) {
        this.x = x;
        this.y = y;
        this.xCoord = xCoord;
        this.yCoord = yCoord;
        this.timeout = timeout;
    }
}

