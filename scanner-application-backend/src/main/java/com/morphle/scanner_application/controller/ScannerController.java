package com.morphle.scanner_application.controller;


import com.morphle.scanner_application.dto.Coordinates;
import com.morphle.scanner_application.dto.ScanHistoryEntry;
import com.morphle.scanner_application.dto.ShiftHistoryEntry;
import com.morphle.scanner_application.service.ScannerService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/scanner")
public class ScannerController {

    private final ScannerService scannerService;

    @Autowired
    public ScannerController(ScannerService scannerService) {
        this.scannerService = scannerService;
    }

    /**
     * Update scanner coordinates
     * @param coordinates New coordinates for the scanner
     * @return Response with status message
     */
    @PostMapping("/move")
    public ResponseEntity<Map<String, String>> updateCoordinates(@RequestBody Coordinates coordinates) {
        System.out.println(coordinates);
        System.out.println(coordinates.getUnitX());
        System.out.println(coordinates.getUnitY());

        System.out.println(coordinates.getXCoord());
        System.out.println(coordinates.getYCoord());
        String result = scannerService.updateCoords(coordinates);
        return ResponseEntity.ok(Map.of("status", result));
    }

    /**
     * Get current scanner state
     * @return Current state of the scanner
     */
    @GetMapping("/state")
    public ResponseEntity<Map<String, String>> getScannerState() {
        String state = scannerService.getScannerState();
        return ResponseEntity.ok(Map.of("state", state));
    }

    /**
     * Get current scanner coordinates
     * @return Current coordinates of the scanner
     */
    @GetMapping("/coordinates")
    public ResponseEntity<Coordinates> getCurrentCoordinates() {
        Coordinates coordinates = scannerService.getCurrentCoordinates();
        return ResponseEntity.ok(coordinates);
    }

    /**
     * Get shift history
     * @return List of shift history entries
     */
    @GetMapping("/history/shift")
    public ResponseEntity<List<ShiftHistoryEntry>> getShiftHistory() {
        List<ShiftHistoryEntry> history = scannerService.getShiftHistory();
        return ResponseEntity.ok(history);
    }

    /**
     * Get scan history
     * @return List of scan history entries
     */
    @GetMapping("/history/scan")
    public ResponseEntity<List<ScanHistoryEntry>> getScanHistory() {
        List<ScanHistoryEntry> history = scannerService.getScanHistory();
        return ResponseEntity.ok(history);
    }


    @PostMapping("/reset")
    public ResponseEntity<String> resetScanner(){
        scannerService.resetScannerState();
        return ResponseEntity.ok("Scanner reset");
    }

}