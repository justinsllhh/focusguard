// ============================================================================
// FOCUSGUARD AI — DISTRACTION & WORKSPACE EXIT DETECTOR
// Sustained time thresholding (>2.5s) to avoid single-frame false positives
// ============================================================================

import { DistractionType, DistractionEvent } from '../types';

export class DistractionDetector {
  private phoneSustainedFrames = 0;
  private phoneThresholdFrames = 25; // ~2.5 seconds at 10-15 inferences/s
  private phoneDetectionCount = 0;

  private exitSustainedFrames = 0;
  private exitThresholdFrames = 30; // ~3.0 seconds absent
  private workspaceExitsCount = 0;
  private isCurrentlyExit = false;

  private activeDistraction: DistractionType = 'None';
  private distractionEvents: DistractionEvent[] = [];

  evaluate(
    isPersonPresent: boolean,
    isPhoneObjectDetected: boolean,
    sessionElapsedSec: number
  ): {
    distractionType: DistractionType;
    isDistracted: boolean;
    phoneCount: number;
    exitCount: number;
  } {
    // 1. Check Person Leaving Workspace
    if (!isPersonPresent) {
      this.exitSustainedFrames++;
      if (this.exitSustainedFrames >= this.exitThresholdFrames && !this.isCurrentlyExit) {
        this.workspaceExitsCount++;
        this.isCurrentlyExit = true;
        this.activeDistraction = 'Person Leaving Workspace';
        this.recordEvent('Person Leaving Workspace', sessionElapsedSec);
      }
    } else {
      this.exitSustainedFrames = 0;
      this.isCurrentlyExit = false;
    }

    // 2. Check Smartphone Detection (Sustained)
    if (isPhoneObjectDetected && isPersonPresent) {
      this.phoneSustainedFrames++;
      if (this.phoneSustainedFrames >= this.phoneThresholdFrames) {
        if (this.activeDistraction !== 'Smartphone') {
          this.phoneDetectionCount++;
          this.activeDistraction = 'Smartphone';
          this.recordEvent('Smartphone', sessionElapsedSec);
        }
      }
    } else {
      this.phoneSustainedFrames = Math.max(0, this.phoneSustainedFrames - 2);
      if (this.phoneSustainedFrames === 0 && !this.isCurrentlyExit) {
        this.activeDistraction = 'None';
      }
    }

    return {
      distractionType: this.activeDistraction,
      isDistracted: this.activeDistraction !== 'None',
      phoneCount: this.phoneDetectionCount,
      exitCount: this.workspaceExitsCount
    };
  }

  private recordEvent(type: DistractionType, time: number): void {
    this.distractionEvents.push({
      id: `dist_${Date.now()}`,
      type,
      startTime: time,
      durationSeconds: 0
    });
  }

  getPhoneCount(): number {
    return this.phoneDetectionCount;
  }

  getExitCount(): number {
    return this.workspaceExitsCount;
  }

  getDistractionEvents(): DistractionEvent[] {
    return [...this.distractionEvents];
  }

  reset(): void {
    this.phoneSustainedFrames = 0;
    this.phoneDetectionCount = 0;
    this.exitSustainedFrames = 0;
    this.workspaceExitsCount = 0;
    this.isCurrentlyExit = false;
    this.activeDistraction = 'None';
    this.distractionEvents = [];
  }
}
