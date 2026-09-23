// ============================================================================
// FOCUSGUARD AI — FOCUS PATTERN SCORE CALCULATOR
// Calculated strictly from observable physical metrics (0 - 100)
// ============================================================================

import { ActivitySnapshot } from '../types';

export class FocusPatternEngine {
  /**
   * Calculate Focus Pattern Score (0 - 100) based strictly on observable activity.
   */
  static calculateScore(
    totalDurationSec: number,
    activeFocusSec: number,
    phoneDetections: number,
    workspaceExits: number,
    headAwayEvents: number
  ): number {
    if (totalDurationSec < 15) return 80; // Default baseline for short tests

    // 1. Presence & Focus Ratio (Weight: 55 points)
    const focusRatio = Math.min(1.0, activeFocusSec / totalDurationSec);
    const presenceScore = focusRatio * 55;

    // 2. Distraction Penalties (Weight: 25 points)
    const phonePenalty = Math.min(18, phoneDetections * 4.5);
    const exitPenalty = Math.min(12, workspaceExits * 4.0);
    const distractionScore = Math.max(0, 25 - phonePenalty - exitPenalty);

    // 3. Attention Stability (Weight: 20 points)
    const headAwayPenalty = Math.min(15, (headAwayEvents / Math.max(1, totalDurationSec / 60)) * 2.0);
    const attentionScore = Math.max(5, 20 - headAwayPenalty);

    const total = Math.round(presenceScore + distractionScore + attentionScore);
    return Math.max(10, Math.min(100, total));
  }

  static analyzeSnapshots(snapshots: ActivitySnapshot[]): {
    activeFocusSec: number;
    potentialDistractionSec: number;
  } {
    let focusCount = 0;
    let distCount = 0;

    snapshots.forEach(s => {
      if (s.isPersonPresent && !s.isDistracted) {
        focusCount++;
      } else {
        distCount++;
      }
    });

    return {
      activeFocusSec: focusCount,
      potentialDistractionSec: distCount
    };
  }
}
