// ============================================================================
// FOCUSGUARD AI — HEAD POSE & ATTENTION DIRECTION ESTIMATOR
// Looking toward workspace, Looking away, Looking left, Looking right, Looking down
// ============================================================================

import { AttentionDirection } from '../types';

export class AttentionTracker {
  private headAwayCount = 0;
  private isCurrentlyAway = false;

  evaluateAttention(
    faceDetected: boolean,
    box: { x: number; y: number; width: number; height: number; centerX: number; centerY: number } | null,
    frameWidth: number,
    frameHeight: number
  ): AttentionDirection {
    if (!faceDetected || !box) {
      this.recordAwayState(true);
      return 'Looking away';
    }

    const faceCenterRatioX = box.centerX / frameWidth;
    const faceCenterRatioY = box.centerY / frameHeight;

    let dir: AttentionDirection = 'Looking toward workspace';

    // 1. Turned severely left
    if (faceCenterRatioX < 0.28) {
      dir = 'Looking left';
      this.recordAwayState(true);
    }
    // 2. Turned severely right
    else if (faceCenterRatioX > 0.72) {
      dir = 'Looking right';
      this.recordAwayState(true);
    }
    // 3. Looking down (e.g. reading notebook/phone under desk)
    else if (faceCenterRatioY > 0.75) {
      dir = 'Looking down';
      this.recordAwayState(false); // Looking down at desk is common in study
    } else {
      dir = 'Looking toward workspace';
      this.recordAwayState(false);
    }

    return dir;
  }

  private recordAwayState(isAway: boolean): void {
    if (isAway && !this.isCurrentlyAway) {
      this.headAwayCount++;
      this.isCurrentlyAway = true;
    } else if (!isAway) {
      this.isCurrentlyAway = false;
    }
  }

  getHeadAwayCount(): number {
    return this.headAwayCount;
  }

  reset(): void {
    this.headAwayCount = 0;
    this.isCurrentlyAway = false;
  }
}
