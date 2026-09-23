// ============================================================================
// FOCUSGUARD AI — POSTURE & BODY GEOMETRY TRACKER
// Observational visual states: Seated, Standing, Leaning, Moving, Left Workspace
// ============================================================================

import { PostureState, WorkspaceZone } from '../types';

export class PostureTracker {
  private lastPosture: PostureState = 'Seated';
  private postureChangeCount = 0;

  evaluatePosture(
    personDetected: boolean,
    currentBox: { x: number; y: number; width: number; height: number } | null,
    calibratedZone: WorkspaceZone
  ): PostureState {
    if (!personDetected || !currentBox) {
      if (this.lastPosture !== 'Left Workspace') {
        this.postureChangeCount++;
        this.lastPosture = 'Left Workspace';
      }
      return 'Left Workspace';
    }

    if (!calibratedZone.isCalibrated) {
      return 'Seated';
    }

    let posture: PostureState = 'Seated';

    const baselineY = calibratedZone.y;
    const baselineHeight = calibratedZone.height;
    const currentY = currentBox.y;
    const currentHeight = currentBox.height;

    // 1. Standing: Head rises significantly higher than baseline seated Y
    if (baselineY - currentY > 70) {
      posture = 'Standing';
    }
    // 2. Leaning Forward: Box becomes significantly larger / closer to camera and shifts downward
    else if (currentHeight - baselineHeight > 45 && currentY > baselineY + 15) {
      posture = 'Leaning Forward';
    }
    // 3. Leaning Backward: Box shrinks noticeably
    else if (baselineHeight - currentHeight > 35) {
      posture = 'Leaning Backward';
    }
    // 4. Movement / Lateral shifting
    else if (Math.abs(currentBox.x - calibratedZone.x) > 60) {
      posture = 'Movement / Shifting';
    } else {
      posture = 'Seated';
    }

    if (posture !== this.lastPosture) {
      this.postureChangeCount++;
      this.lastPosture = posture;
    }

    return posture;
  }

  getPostureChangeCount(): number {
    return this.postureChangeCount;
  }

  reset(): void {
    this.lastPosture = 'Seated';
    this.postureChangeCount = 0;
  }
}
