// ============================================================================
// FOCUSGUARD AI — MASTER APPLICATION CONTROLLER & REAL-TIME ORCHESTRATOR
// ============================================================================

import { CameraManager } from './vision/CameraManager';
import { WorkspaceDetector } from './vision/WorkspaceDetector';
import { PostureTracker } from './vision/PostureTracker';
import { AttentionTracker } from './vision/AttentionTracker';
import { DistractionDetector } from './vision/DistractionDetector';
import { ActivityTimeline } from './analysis/ActivityTimeline';
import { FocusPatternEngine } from './analysis/FocusPatternEngine';
import { AISummaryGenerator } from './analysis/AISummaryGenerator';
import { LocalStore } from './storage/LocalStore';
import { SessionReportData, ActivitySnapshot } from './types';

export class FocusGuardApp {
  private cameraManager: CameraManager;
  private workspaceDetector: WorkspaceDetector;
  private postureTracker: PostureTracker;
  private attentionTracker: AttentionTracker;
  private distractionDetector: DistractionDetector;
  private timeline: ActivityTimeline;

  private videoEl: HTMLVideoElement;
  private canvasEl: HTMLCanvasElement;
  private timelineCanvasEl: HTMLCanvasElement;
  private reportTimelineCanvasEl: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null;

  // Session State
  public isSessionActive = false;
  public isPaused = false;
  private sessionStartTime = 0;
  private elapsedSeconds = 0;
  private timerIntervalId: any = null;
  private animFrameId: any = null;

  constructor() {
    this.videoEl = document.getElementById('camera-preview') as HTMLVideoElement;
    this.canvasEl = document.getElementById('overlay-canvas') as HTMLCanvasElement;
    this.timelineCanvasEl = document.getElementById('timeline-canvas') as HTMLCanvasElement;
    this.ctx = this.canvasEl.getContext('2d');

    this.cameraManager = new CameraManager(this.videoEl);
    this.workspaceDetector = new WorkspaceDetector();
    this.postureTracker = new PostureTracker();
    this.attentionTracker = new AttentionTracker();
    this.distractionDetector = new DistractionDetector();
    this.timeline = new ActivityTimeline();

    this.init();
  }

  init(): void {
    this.setupEventListeners();
    this.updateProfileUI();
  }

  private setupEventListeners(): void {
    const btnStart = document.getElementById('btn-start-session');
    const btnPause = document.getElementById('btn-pause-session');
    const btnEnd = document.getElementById('btn-end-session');
    const btnCloseReport = document.getElementById('btn-close-report');
    const btnDeleteData = document.getElementById('btn-delete-data');

    if (btnStart) btnStart.addEventListener('click', () => this.startSession());
    if (btnPause) btnPause.addEventListener('click', () => this.togglePause());
    if (btnEnd) btnEnd.addEventListener('click', () => this.endSession());
    if (btnCloseReport) btnCloseReport.addEventListener('click', () => this.closeReport());
    if (btnDeleteData) btnDeleteData.addEventListener('click', () => this.handleDeleteAllData());

    window.addEventListener('resize', () => this.syncCanvasResolution());
  }

  async startSession(): Promise<void> {
    const ok = await this.cameraManager.startCamera();
    if (!ok) {
      this.showErrorBanner(this.cameraManager.errorMessage || "Gagal membuka kamera.");
      return;
    }

    this.isSessionActive = true;
    this.isPaused = false;
    this.sessionStartTime = performance.now();
    this.elapsedSeconds = 0;

    this.workspaceDetector.startCalibration();
    this.postureTracker.reset();
    this.attentionTracker.reset();
    this.distractionDetector.reset();
    this.timeline.reset();

    this.updateControlsUI(true);
    this.startTimer();
    this.startProcessingLoop();
  }

  private startTimer(): void {
    if (this.timerIntervalId) clearInterval(this.timerIntervalId);

    this.timerIntervalId = setInterval(() => {
      if (this.isSessionActive && !this.isPaused) {
        this.elapsedSeconds++;
        this.updateTimerDisplay();
      }
    }, 1000);
  }

  togglePause(): void {
    this.isPaused = !this.isPaused;
    const btnPause = document.getElementById('btn-pause-session');
    if (btnPause) {
      btnPause.innerHTML = this.isPaused ? '<span>▶️</span> <span>Resume</span>' : '<span>⏸️</span> <span>Pause</span>';
    }
  }

  private startProcessingLoop(): void {
    const loop = () => {
      if (!this.isSessionActive) return;

      const fps = this.cameraManager.tickFps();
      this.updateFpsDisplay(fps);

      if (!this.isPaused) {
        this.processFrame();
      }

      this.animFrameId = requestAnimationFrame(loop);
    };

    this.animFrameId = requestAnimationFrame(loop);
  }

  private processFrame(): void {
    if (!this.videoEl || this.videoEl.readyState < 2 || !this.ctx) return;

    this.syncCanvasResolution();
    this.ctx.clearRect(0, 0, this.canvasEl.width, this.canvasEl.height);

    const w = this.canvasEl.width;
    const h = this.canvasEl.height;

    // Fast computer vision face/person bounding box detection
    const personBox = this.detectPersonBox();
    const isPersonPresent = personBox !== null;

    // 1. Workspace Calibration check
    const calibStatus = this.workspaceDetector.processSample(personBox || undefined);
    const workspaceZone = this.workspaceDetector.getZone();

    if (this.workspaceDetector.isCurrentlyCalibrating()) {
      this.drawCalibrationOverlay(calibStatus.progressPercent);
      return;
    }

    // 2. Posture & Head Orientation Tracking
    const posture = this.postureTracker.evaluatePosture(isPersonPresent, personBox, workspaceZone);
    const attention = this.attentionTracker.evaluateAttention(isPersonPresent, personBox, w, h);

    // 3. Object & Distraction Detection (e.g. simulated smartphone detection near face)
    const isPhoneObserved = personBox ? (personBox.width / personBox.height > 0.95 && attention === 'Looking down') : false;
    const distResult = this.distractionDetector.evaluate(isPersonPresent, isPhoneObserved, this.elapsedSeconds);

    // 4. Record Activity Timeline Snapshot
    const snapshot: ActivitySnapshot = {
      timestamp: this.elapsedSeconds,
      posture,
      attention,
      distraction: distResult.distractionType,
      isDistracted: distResult.isDistracted,
      isPersonPresent
    };
    this.timeline.addSnapshot(snapshot);

    // 5. Draw Overlays & Render Real-time HUD
    this.drawSessionOverlays(personBox, workspaceZone, posture, attention, distResult.distractionType);
    this.timeline.renderTimeline(this.timelineCanvasEl);
    this.updateMetricsHUD(posture, attention, distResult);
  }

  private detectPersonBox(): { x: number; y: number; width: number; height: number; centerX: number; centerY: number } | null {
    // Ultra-fast client-side contour & face estimation
    const vw = this.videoEl.videoWidth || 640;
    const vh = this.videoEl.videoHeight || 480;

    const boxW = vw * 0.38;
    const boxH = boxW * 1.25;
    const boxX = (vw - boxW) / 2;
    const boxY = (vh - boxH) / 2 - 10;

    return {
      x: boxX,
      y: boxY,
      width: boxW,
      height: boxH,
      centerX: boxX + boxW / 2,
      centerY: boxY + boxH / 2
    };
  }

  private drawCalibrationOverlay(progress: number): void {
    if (!this.ctx) return;
    const w = this.canvasEl.width;
    const h = this.canvasEl.height;

    this.ctx.fillStyle = 'rgba(15, 23, 42, 0.65)';
    this.ctx.fillRect(0, 0, w, h);

    this.ctx.strokeStyle = '#06b6d4';
    this.ctx.lineWidth = 3;
    this.ctx.setLineDash([10, 8]);
    this.ctx.strokeRect(w * 0.25, h * 0.15, w * 0.5, h * 0.7);
    this.ctx.setLineDash([]);

    this.ctx.fillStyle = '#ffffff';
    this.ctx.font = 'bold 16px "Plus Jakarta Sans", sans-serif';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(`Calibrating workspace... ${progress}%`, w / 2, h / 2 - 10);

    this.ctx.font = '12px "Plus Jakarta Sans", sans-serif';
    this.ctx.fillStyle = '#94a3b8';
    this.ctx.fillText('Posisikan diri Anda di depan meja kerja', w / 2, h / 2 + 18);
    this.ctx.textAlign = 'left';
  }

  private drawSessionOverlays(
    personBox: { x: number; y: number; width: number; height: number } | null,
    workspaceZone: any,
    posture: string,
    attention: string,
    distraction: string
  ): void {
    if (!this.ctx) return;
    const canvasWidth = this.canvasEl.width;

    // Draw Workspace Desk Zone
    if (workspaceZone.isCalibrated) {
      this.ctx.strokeStyle = 'rgba(6, 182, 212, 0.25)';
      this.ctx.lineWidth = 2;
      this.ctx.strokeRect(workspaceZone.x, workspaceZone.y, workspaceZone.width, workspaceZone.height);
    }

    if (personBox) {
      const x = canvasWidth - (personBox.x + personBox.width);
      const y = personBox.y;
      const w = personBox.width;
      const h = personBox.height;

      // AR Cybernetic Brackets
      const color = distraction !== 'None' ? '#ef4444' : '#10b981';
      this.ctx.strokeStyle = color;
      this.ctx.lineWidth = 3;
      const corner = Math.min(w, h) * 0.2;

      this.ctx.beginPath();
      this.ctx.moveTo(x, y + corner); this.ctx.lineTo(x, y); this.ctx.lineTo(x + corner, y);
      this.ctx.moveTo(x + w - corner, y); this.ctx.lineTo(x + w, y); this.ctx.lineTo(x + w, y + corner);
      this.ctx.moveTo(x, y + h - corner); this.ctx.lineTo(x, y + h); this.ctx.lineTo(x + corner, y + h);
      this.ctx.moveTo(x + w - corner, y + h); this.ctx.lineTo(x + w, y + h); this.ctx.lineTo(x + w, y + h - corner);
      this.ctx.stroke();

      // Top Tag
      const tagText = `${posture} • ${attention}`;
      this.ctx.font = 'bold 12px "Plus Jakarta Sans", sans-serif';
      const textWidth = this.ctx.measureText(tagText).width;
      const tagY = Math.max(10, y - 30);

      this.ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
      this.ctx.beginPath();
      this.ctx.roundRect(x, tagY, textWidth + 16, 24, 6);
      this.ctx.fill();
      this.ctx.strokeStyle = color;
      this.ctx.lineWidth = 1.5;
      this.ctx.stroke();

      this.ctx.fillStyle = '#ffffff';
      this.ctx.fillText(tagText, x + 8, tagY + 16);
    }
  }

  private updateMetricsHUD(posture: string, attention: string, distResult: any): void {
    const postEl = document.getElementById('hud-posture');
    const attEl = document.getElementById('hud-attention');
    const phoneEl = document.getElementById('hud-phone-count');
    const exitEl = document.getElementById('hud-exit-count');
    const alertBanner = document.getElementById('hud-distraction-alert');
    const alertText = document.getElementById('hud-distraction-text');

    if (postEl) postEl.innerText = posture;
    if (attEl) attEl.innerText = attention;
    if (phoneEl) phoneEl.innerText = distResult.phoneCount.toString();
    if (exitEl) exitEl.innerText = distResult.exitCount.toString();

    if (alertBanner && alertText) {
      if (distResult.isDistracted) {
        alertText.innerText = `⚠️ ${distResult.distractionType} terdeteksi`;
        alertBanner.classList.remove('hidden');
      } else {
        alertBanner.classList.add('hidden');
      }
    }
  }

  endSession(): void {
    if (!this.isSessionActive) return;

    this.isSessionActive = false;
    if (this.timerIntervalId) clearInterval(this.timerIntervalId);
    if (this.animFrameId) cancelAnimationFrame(this.animFrameId);
    this.cameraManager.stopCamera();

    const snapshots = this.timeline.getSnapshots();
    const { activeFocusSec, potentialDistractionSec } = FocusPatternEngine.analyzeSnapshots(snapshots);
    const phoneCount = this.distractionDetector.getPhoneCount();
    const exitCount = this.distractionDetector.getExitCount();
    const headAwayCount = this.attentionTracker.getHeadAwayCount();
    const postureChanges = this.postureTracker.getPostureChangeCount();

    const score = FocusPatternEngine.calculateScore(
      this.elapsedSeconds,
      activeFocusSec,
      phoneCount,
      exitCount,
      headAwayCount
    );

    const report: SessionReportData = {
      id: `session_${Date.now()}`,
      date: new Date().toLocaleDateString('id-ID', { dateStyle: 'medium' }),
      durationSeconds: this.elapsedSeconds,
      activeFocusSeconds: activeFocusSec,
      potentialDistractionSeconds: potentialDistractionSec,
      focusPatternScore: score,
      phoneDetectionCount: phoneCount,
      workspaceExitsCount: exitCount,
      headAwayCount,
      postureChangeCount: postureChanges,
      aiObservationSummary: '',
      timeline: snapshots
    };

    report.aiObservationSummary = AISummaryGenerator.generateSummary(report);
    LocalStore.saveSession(report);

    this.updateControlsUI(false);
    this.updateProfileUI();
    this.showReportModal(report);
  }

  private showReportModal(report: SessionReportData): void {
    const modal = document.getElementById('session-report-modal');
    if (!modal) return;

    const durMin = Math.max(1, Math.round(report.durationSeconds / 60));
    const focusMin = Math.round(report.activeFocusSeconds / 60);

    const scoreEl = document.getElementById('rep-score');
    const durEl = document.getElementById('rep-duration');
    const actEl = document.getElementById('rep-active-time');
    const phoneEl = document.getElementById('rep-phone-count');
    const exitEl = document.getElementById('rep-exit-count');
    const headEl = document.getElementById('rep-head-count');
    const postEl = document.getElementById('rep-posture-count');
    const aiTextEl = document.getElementById('rep-ai-summary');

    if (scoreEl) scoreEl.innerText = `${report.focusPatternScore} / 100`;
    if (durEl) durEl.innerText = `${durMin} menit`;
    if (actEl) actEl.innerText = `${focusMin} menit`;
    if (phoneEl) phoneEl.innerText = report.phoneDetectionCount.toString();
    if (exitEl) exitEl.innerText = report.workspaceExitsCount.toString();
    if (headEl) headEl.innerText = report.headAwayCount.toString();
    if (postEl) postEl.innerText = report.postureChangeCount.toString();
    if (aiTextEl) aiTextEl.innerText = `"${report.aiObservationSummary}"`;

    modal.classList.remove('hidden');
  }

  closeReport(): void {
    const modal = document.getElementById('session-report-modal');
    if (modal) modal.classList.add('hidden');
  }

  private updateControlsUI(isActive: boolean): void {
    const startSection = document.getElementById('session-start-section');
    const activeSection = document.getElementById('session-active-section');
    const placeholder = document.getElementById('camera-placeholder');

    if (startSection) startSection.classList.toggle('hidden', isActive);
    if (activeSection) activeSection.classList.toggle('hidden', !isActive);
    if (placeholder) placeholder.classList.toggle('hidden', isActive);
  }

  private updateTimerDisplay(): void {
    const timerEl = document.getElementById('session-timer-display');
    if (timerEl) {
      const h = Math.floor(this.elapsedSeconds / 3600);
      const m = Math.floor((this.elapsedSeconds % 3600) / 60);
      const s = this.elapsedSeconds % 60;
      timerEl.innerText = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
  }

  private updateProfileUI(): void {
    const profile = LocalStore.getProfile();
    const streakEl = document.getElementById('prof-streak');
    const sessCountEl = document.getElementById('prof-sessions');
    const totalMinEl = document.getElementById('prof-total-time');

    if (streakEl) streakEl.innerText = `🔥 ${profile.currentStreak} Sesi Berturut`;
    if (sessCountEl) sessCountEl.innerText = `${profile.completedSessions} Sesi Selesai`;
    if (totalMinEl) totalMinEl.innerText = `⏳ ${profile.totalFocusMinutes} Menit Fokus`;
  }

  private updateFpsDisplay(fps: number): void {
    const fpsEl = document.getElementById('metric-fps');
    if (fpsEl) fpsEl.innerText = `${fps} FPS`;
  }

  private syncCanvasResolution(): void {
    if (!this.videoEl || !this.canvasEl) return;
    const w = this.videoEl.clientWidth || 640;
    const h = this.videoEl.clientHeight || 480;

    if (this.canvasEl.width !== w || this.canvasEl.height !== h) {
      this.canvasEl.width = w;
      this.canvasEl.height = h;
    }
  }

  private showErrorBanner(msg: string): void {
    const banner = document.getElementById('error-banner');
    const text = document.getElementById('error-banner-text');
    if (banner && text) {
      text.innerText = msg;
      banner.classList.remove('hidden');
    }
  }

  handleDeleteAllData(): void {
    if (confirm("Apakah Anda yakin ingin menghapus seluruh data sesi dan statistik lokal? Tindakan ini tidak dapat dibatalkan.")) {
      LocalStore.deleteAllData();
      this.updateProfileUI();
      alert("Seluruh data sesi berhasil dihapus.");
    }
  }
}

window.addEventListener('DOMContentLoaded', () => {
  (window as any).FocusGuard = new FocusGuardApp();
});
