package com.morphle.scanner_application.service;

import com.morphle.scanner_application.dto.Coordinates;
import com.morphle.scanner_application.dto.ScanHistoryEntry;
import com.morphle.scanner_application.dto.ScannerStatus;
import com.morphle.scanner_application.dto.ShiftHistoryEntry;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.locks.ReadWriteLock;
import java.util.concurrent.locks.ReentrantReadWriteLock;

@Service
public class ScannerService {
    // Thread-safe variables using synchronized methods and locks
    private volatile double lastX = 0;
    private volatile double lastY = 0;
    private volatile double lastXcoord = 0;
    private volatile double lastYcoord = 0;

    private volatile double shiftTimer = 0;
    private volatile double totalShift = 0;
    private volatile String scannerState = "IDLE";
    private volatile Coordinates finalCoords;

    // Using ReadWriteLock for thread-safe access to shared collections
    private final ReadWriteLock shiftHistoryLock = new ReentrantReadWriteLock();
    private final List<ShiftHistoryEntry> shiftHistory = new ArrayList<>();

    private final ReadWriteLock scanHistoryLock = new ReentrantReadWriteLock();
    private final List<ScanHistoryEntry> scanHistory = new ArrayList<>();

    // Thread pool for managing concurrent operations
    private final ExecutorService executorService = Executors.newCachedThreadPool();

    // WebSocket messaging template
    private final SimpMessagingTemplate messagingTemplate;

    @Autowired
    public ScannerService(SimpMessagingTemplate messagingTemplate) {
        this.messagingTemplate = messagingTemplate;
    }

    /**
     * Updates the scanner coordinates and starts the shift process
     * @param coords New coordinates for the scanner
     * @return Status message
     */
    public synchronized String updateCoords(Coordinates coords) {
        totalShift = Math.abs(coords.getUnitX() - lastX) + Math.abs(coords.getUnitY() - lastY);
        finalCoords = coords;
        shiftTimer = 3 * Math.sqrt(totalShift);
        moveScanner(coords, shiftTimer);

        // Send initial state update
        sendStateUpdate();

        return "Shift started";
    }

    /**
     * Moves the scanner to the specified coordinates
     * @param coords Target coordinates
     * @param timeout Time to wait during movement
     */
    private synchronized void moveScanner(Coordinates coords, double timeout) {
        if ("MOVING".equals(scannerState) || "FOCUS".equals(scannerState)) return;

        lastX = coords.getUnitX();
        lastY = coords.getUnitY();
        lastXcoord = coords.getXCoord();
        lastYcoord = coords.getYCoord();
        scannerState = "MOVING";
        shiftTimer = 0;
        totalShift = 0;
        System.out.println("Shift in progress. Timeout: " + timeout);

        // Send state update via WebSocket
        sendStateUpdate();

        executorService.submit(() -> {
            try {
                Thread.sleep((long) (timeout * 1000));
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
            }

            synchronized (this) {
                scannerState = "IDLE";

                // Add entry to shift history in a thread-safe manner
                ShiftHistoryEntry newEntry = new ShiftHistoryEntry(
                        roundTo(coords.getUnitX(), 2),
                        roundTo(coords.getUnitY(), 2),
                        coords.getXCoord(),
                        coords.getYCoord(),
                        roundTo(timeout, 2)
                );

                shiftHistoryLock.writeLock().lock();
                try {
                    shiftHistory.add(newEntry);
                } finally {
                    shiftHistoryLock.writeLock().unlock();
                }

                // Send shift history update via WebSocket
                sendShiftHistoryUpdate(shiftHistory);

                // Send state update via WebSocket
                sendStateUpdate();

                if (shiftTimer > 0) {
                    moveScanner(finalCoords, shiftTimer);
                } else {
                    try {
                        Thread.sleep(20);
                    } catch (InterruptedException e) {
                        Thread.currentThread().interrupt();
                    }
                    focusImage(coords);
                }
            }
        });
    }

    /**
     * Focuses the scanner after it has moved to the target position
     * @param coords The coordinates where focusing is happening
     */
    private synchronized void focusImage(Coordinates coords) {
        scannerState = "FOCUS";

        // Send state update via WebSocket
        sendStateUpdate();

        executorService.submit(() -> {
            try {
                Thread.sleep(2000);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
            }

            synchronized (this) {
                scannerState = "READY";

                // Add entry to scan history in a thread-safe manner
                ScanHistoryEntry newEntry = new ScanHistoryEntry(
                        roundTo(coords.getUnitX(), 2),
                        roundTo(coords.getUnitY(), 2),
                        coords.getXCoord(),
                        coords.getYCoord()
                );

                scanHistoryLock.writeLock().lock();
                try {
                    scanHistory.add(newEntry);
                } finally {
                    scanHistoryLock.writeLock().unlock();
                }

                // Send scan history update via WebSocket
                sendScanHistoryUpdate(scanHistory);

                // Send state update via WebSocket
                sendStateUpdate();

                if (shiftTimer > 0) {
                    moveScanner(finalCoords, shiftTimer);
                }
            }
        });
    }

    /**
     * Helper method to round a value to a specific number of decimal places
     */
    private double roundTo(double value, int decimals) {
        double factor = Math.pow(10, decimals);
        return Math.round(value * factor) / factor;
    }

    /**
     * Gets the current scanner state
     * @return Current state
     */
    public synchronized String getScannerState() {
        return scannerState;
    }

    /**
     * Gets the current scanner coordinates
     * @return Current coordinates
     */
    public synchronized Coordinates getCurrentCoordinates() {
        return new Coordinates(lastX, lastY, lastXcoord, lastYcoord); // Assuming XCoord and YCoord are not tracked separately
    }

    /**
     * Gets the shift history
     * @return List of shift history entries
     */
    public List<ShiftHistoryEntry> getShiftHistory() {
        shiftHistoryLock.readLock().lock();
        try {
            return new ArrayList<>(shiftHistory); // Return a copy to avoid concurrent modification
        } finally {
            shiftHistoryLock.readLock().unlock();
        }
    }

    /**
     * Gets the scan history
     * @return List of scan history entries
     */
    public List<ScanHistoryEntry> getScanHistory() {
        scanHistoryLock.readLock().lock();
        try {
            return new ArrayList<>(scanHistory); // Return a copy to avoid concurrent modification
        } finally {
            scanHistoryLock.readLock().unlock();
        }
    }

    /**
     * Sends the scanner state update via WebSocket
     */
    private void sendStateUpdate() {
        ScannerStatus status = new ScannerStatus(
                scannerState,
                new Coordinates(lastX, lastY, lastXcoord, lastYcoord)
        );
        messagingTemplate.convertAndSend("/topic/scanner/state", status);
    }

    /**
     * Sends a shift history update via WebSocket
     */
    private void sendShiftHistoryUpdate(List<ShiftHistoryEntry> entry) {
        messagingTemplate.convertAndSend("/topic/scanner/shift", entry);
    }

    /**
     * Sends a scan history update via WebSocket
     */
    private void sendScanHistoryUpdate(List<ScanHistoryEntry> entry) {
        messagingTemplate.convertAndSend("/topic/scanner/scan", entry);
    }

    /**
     * Resets all internal state variables of the scanner
     */
    public synchronized void resetScannerState() {
        lastX = 0;
        lastY = 0;
        lastXcoord = 0;
        lastYcoord = 0;

        shiftTimer = 0;
        totalShift = 0;
        scannerState = "IDLE";
        finalCoords = null;

        // Clear histories with proper locking
        shiftHistoryLock.writeLock().lock();
        try {
            shiftHistory.clear();
        } finally {
            shiftHistoryLock.writeLock().unlock();
        }

        scanHistoryLock.writeLock().lock();
        try {
            scanHistory.clear();
        } finally {
            scanHistoryLock.writeLock().unlock();
        }

        // Notify clients via WebSocket
        sendShiftHistoryUpdate(shiftHistory);
        sendScanHistoryUpdate(scanHistory);
        sendStateUpdate();
    }


    /**
     * Cleanup method to shut down the executor service
     */
    public void shutdown() {
        executorService.shutdown();
    }
}