// ============================================================================
// FOCUSGUARD AI — WORKSPACE CALIBRATION & BOUNDING ZONE DETECTOR
// Maps user baseline presence and desk workspace area (5-10s ephemeral phase)
// ============================================================================

import { WorkspaceZone } from '../types';

export class WorkspaceDetector {
  private isCalibrating = false;
  private calibrationStartTime = 0;
  private calibrationDurationMs = 5000; // 5 seconds calibration
  private samples: { x: number; y: number; width: number; height: number }[] = [];
  private zone: WorkspaceZone = {
    x: 0,
    y: 0,
    width: 0,
    height: 0,
    isCalibrated: false
  };

  startCalibration(): void {
    this.isCalibrating = true;
    this.calibrationStartTime = performance.now();
    this.samples = [];
    this.zone.isCalibrated = false;
  }

  processSample(detectedBox?: { x: number; y: number; width: number; height: number }): {
    isDone: boolean;
    progressPercent: number;
  } {
    if (!this.isCalibrating) {
      return { isDone: this.zone.isCalibrated, progressPercent: 100 };
    }

    const now = performance.now();
    const elapsed = now - this.calibrationStartTime;
    const progress = Math.min(100, Math.round((elapsed / this.calibrationDurationMs) * 100));

    if (detectedBox) {
      this.samples.push(detectedBox);
    }

    if (elapsed >= this.calibrationDurationMs) {
      this.finishCalibration();
      return { isDone: true, progressPercent: 100 };
    }

    return { isDone: false, progressPercent: progress };
  }

  private finishCalibration(): void {
    this.isCalibrating = false;

    if (this.samples.length > 0) {
      let sumX = 0, sumY = 0, sumW = 0, sumH = 0;
      this.samples.forEach(s => {
        sumX += s.x;
        sumY += s.y;
        sumW += s.width;
        sumH += s.height;
      });

      const count = this.samples.length;
      this.zone = {
        x: sumX / count,
        y: sumY / count,
        width: sumW / count,
        height: sumH / count,
        isCalibrated: true
      };
    } else {
      // Default center workspace zone
      this.zone = {
        x: 160,
        y: 80,
        width: 320,
        height: 340,
        isCalibrated: true
      };
    }
  }

  getZone(): WorkspaceZone {
    return { ...this.zone };
  }

  isCurrentlyCalibrating(): boolean {
    return this.isCalibrating;
  }
}
