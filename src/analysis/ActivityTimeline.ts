// ============================================================================
// FOCUSGUARD AI — ACTIVITY TIMELINE RECORDER & CANVAS RENDERER
// Multi-layer visual timeline: Focus, Head-Away, Phone, Movement
// ============================================================================

import { ActivitySnapshot } from '../types';

export class ActivityTimeline {
  private snapshots: ActivitySnapshot[] = [];
  private sampleIntervalSec = 1.0; // 1 sample per second
  private lastSampleTime = -1;

  addSnapshot(snapshot: ActivitySnapshot): void {
    const currentSec = Math.floor(snapshot.timestamp);
    if (currentSec !== this.lastSampleTime) {
      this.snapshots.push(snapshot);
      this.lastSampleTime = currentSec;
    }
  }

  getSnapshots(): ActivitySnapshot[] {
    return [...this.snapshots];
  }

  /**
   * Render multi-layer activity timeline on HTML5 Canvas.
   */
  renderTimeline(canvas: HTMLCanvasElement): void {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);

    const totalSamples = this.snapshots.length;
    if (totalSamples === 0) {
      ctx.fillStyle = '#64748b';
      ctx.font = '11px "Plus Jakarta Sans", sans-serif';
      ctx.fillText('Timeline akan terisi saat sesi fokus berjalan...', 20, height / 2 + 4);
      return;
    }

    const rows = [
      { label: 'Active Focus', color: '#10b981', check: (s: ActivitySnapshot) => !s.isDistracted && s.isPersonPresent },
      { label: 'Head Away', color: '#f59e0b', check: (s: ActivitySnapshot) => s.attention !== 'Looking toward workspace' },
      { label: 'Phone / Distraction', color: '#ef4444', check: (s: ActivitySnapshot) => s.distraction === 'Smartphone' },
      { label: 'Posture Shift / Exit', color: '#8b5cf6', check: (s: ActivitySnapshot) => s.posture === 'Left Workspace' || s.posture === 'Movement / Shifting' }
    ];

    const labelWidth = 120;
    const timelineWidth = width - labelWidth - 20;
    const rowHeight = (height - 30) / rows.length;

    // Draw Rows
    rows.forEach((r, rIdx) => {
      const y = 15 + rIdx * rowHeight;

      // Label
      ctx.fillStyle = '#94a3b8';
      ctx.font = 'bold 10px "Plus Jakarta Sans", sans-serif';
      ctx.fillText(r.label, 10, y + rowHeight * 0.65);

      // Track Background
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(labelWidth, y + 2, timelineWidth, rowHeight - 6);

      // Activity Blocks
      const blockWidth = Math.max(2, timelineWidth / totalSamples);
      ctx.fillStyle = r.color;

      this.snapshots.forEach((s, sIdx) => {
        if (r.check(s)) {
          const x = labelWidth + (sIdx / totalSamples) * timelineWidth;
          ctx.fillRect(x, y + 3, blockWidth, rowHeight - 8);
        }
      });
    });
  }

  reset(): void {
    this.snapshots = [];
    this.lastSampleTime = -1;
  }
}
