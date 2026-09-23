// ============================================================================
// FOCUSGUARD AI — PURE JAVASCRIPT COMPUTER VISION ENGINE (ZERO DEPENDENCY)
// Client-Side Observational Telemetry & Focus Analytics
// ============================================================================

(function () {
  'use strict';

  // =========================================================================
  // 1. LOCAL STORAGE & DATA PERSISTENCE (With In-Memory Fallback)
  // =========================================================================
  const LocalStore = {
    SESSIONS_KEY: 'focusguard_sessions',
    PROFILE_KEY: 'focusguard_profile',
    _memSessions: [],
    _memProfile: null,

    getSessions: function () {
      try {
        const data = localStorage.getItem(this.SESSIONS_KEY);
        if (data) {
          const parsed = JSON.parse(data);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      } catch (e) {
        console.warn('LocalStorage read unavailable, using memory store:', e);
      }
      return this._memSessions;
    },

    saveSession: function (report) {
      // Create a clean, quota-safe copy of report
      const cleanReport = {
        id: report.id || 'session_' + Date.now(),
        date: report.date || new Date().toLocaleString('id-ID'),
        durationSeconds: report.durationSeconds || 1,
        activeFocusSeconds: report.activeFocusSeconds || 0,
        distractedSeconds: report.distractedSeconds || 0,
        focusScore: report.focusScore || 75,
        phoneCount: report.phoneCount || 0,
        exitCount: report.exitCount || 0,
        headAwayCount: report.headAwayCount || 0,
        postureChangeCount: report.postureChangeCount || 0,
        summaryNarrative: report.summaryNarrative || ''
      };

      const sessions = this.getSessions();
      sessions.unshift(cleanReport);
      if (sessions.length > 50) sessions.pop();
      this._memSessions = sessions;

      try {
        localStorage.setItem(this.SESSIONS_KEY, JSON.stringify(sessions));
      } catch (e) {
        console.warn('LocalStorage save fallback to memory:', e);
      }

      this.updateProfile(cleanReport);
    },

    getProfile: function () {
      if (this._memProfile) return this._memProfile;

      try {
        const data = localStorage.getItem(this.PROFILE_KEY);
        if (data) {
          const parsed = JSON.parse(data);
          if (parsed) {
            this._memProfile = parsed;
            return parsed;
          }
        }
      } catch (e) {}

      this._memProfile = {
        totalFocusMinutes: 0,
        completedSessions: 0,
        currentStreak: 1,
        lastSessionDate: null,
        milestones: {
          firstSession: false,
          thirtyMinSession: false,
          fiveSessions: false,
          zenMaster: false
        }
      };
      return this._memProfile;
    },

    updateProfile: function (report) {
      const profile = this.getProfile();
      const durationMin = Math.max(1, Math.round(report.durationSeconds / 60));

      profile.totalFocusMinutes = (profile.totalFocusMinutes || 0) + durationMin;
      profile.completedSessions = (profile.completedSessions || 0) + 1;

      const todayStr = new Date().toDateString();
      if (profile.lastSessionDate !== todayStr) {
        profile.currentStreak = (profile.currentStreak || 0) + 1;
        profile.lastSessionDate = todayStr;
      }

      profile.milestones = profile.milestones || {};
      profile.milestones.firstSession = true;
      if (durationMin >= 25) profile.milestones.thirtyMinSession = true;
      if (profile.completedSessions >= 5) profile.milestones.fiveSessions = true;
      if (report.focusScore >= 85) profile.milestones.zenMaster = true;

      this._memProfile = profile;
      try {
        localStorage.setItem(this.PROFILE_KEY, JSON.stringify(profile));
      } catch (e) {}
    },

    deleteAllData: function () {
      this._memSessions = [];
      this._memProfile = null;
      try {
        localStorage.removeItem(this.SESSIONS_KEY);
        localStorage.removeItem(this.PROFILE_KEY);
      } catch (e) {}
    }
  };

  // =========================================================================
  // 2. MATHEMATICAL FOCUS PATTERN SCORING ENGINE
  // =========================================================================
  const FocusPatternEngine = {
    calculateScore: function (totalSec, activeSec, phoneCount, exitCount, headAwayCount, slouchSec) {
      if (totalSec < 10) return 85;

      const presenceRatio = Math.min(1.0, activeSec / totalSec);
      const attentionRatio = Math.max(0, 1.0 - (headAwayCount * 3.5) / Math.max(1, totalSec / 60));
      const postureStability = Math.max(0, 1.0 - (slouchSec / Math.max(1, totalSec)) * 0.4);

      const baseScore = (0.60 * attentionRatio + 0.40 * postureStability) * 100;
      const phonePenalty = Math.min(25, phoneCount * 5.0);
      const exitPenalty = Math.min(20, exitCount * 6.0);

      const finalScore = Math.round((baseScore - phonePenalty - exitPenalty) * presenceRatio);
      return Math.max(10, Math.min(100, finalScore));
    },

    analyzeSnapshots: function (snapshots) {
      let activeFocus = 0;
      let distracted = 0;
      let slouchCount = 0;

      snapshots.forEach(function (s) {
        if (s.isPersonPresent && !s.isDistracted && s.attention === 'Center (Screen)') {
          activeFocus++;
        } else {
          distracted++;
        }
        if (s.posture === 'Slouching / Leaning') {
          slouchCount++;
        }
      });

      return {
        activeFocusSec: activeFocus,
        distractedSec: distracted,
        slouchSec: slouchCount
      };
    }
  };

  // =========================================================================
  // 3. AI OBSERVATIONAL SUMMARY GENERATOR
  // =========================================================================
  const AISummaryGenerator = {
    generateSummary: function (data) {
      const totalMin = Math.max(1, Math.round(data.durationSeconds / 60));
      const focusMin = Math.round(data.activeFocusSeconds / 60);
      const focusPercent = Math.round((data.activeFocusSeconds / Math.max(1, data.durationSeconds)) * 100);

      const paragraphs = [];

      if (focusPercent >= 80) {
        paragraphs.push(`Sepanjang sesi kerja berdurasi ${totalMin} menit, keberadaan fisik Anda di area kerja sangat konsisten (tercatat ${focusPercent}% waktu berorientasi aktif ke workstation).`);
      } else {
        paragraphs.push(`Pada sesi kerja berdurasi ${totalMin} menit ini, aktivitas fokus visual teramati selama ${focusMin} menit (${focusPercent}% dari total waktu sesi).`);
      }

      const obs = [];
      if (data.phoneCount > 0) {
        obs.push(`teramati interaksi dengan perangkat smartphone sebanyak ${data.phoneCount} kali`);
      }
      if (data.exitCount > 0) {
        obs.push(`tercatat meninggalkan area pandang kamera sebanyak ${data.exitCount} kali`);
      }
      if (data.headAwayCount > 3) {
        obs.push(`orientasi kepala berpaling dari layar sebanyak ${data.headAwayCount} kali`);
      }

      if (obs.length > 0) {
        paragraphs.push(`Analisis pola visual mencatat: ${obs.join(', ')}.`);
      } else {
        paragraphs.push(`Tidak teramati adanya distraksi perangkat eksternal atau kepergian dari area kerja yang signifikan.`);
      }

      if (data.postureChangeCount > 5) {
        paragraphs.push(`Terjadi penyesuaian posisi duduk/postur tubuh sebanyak ${data.postureChangeCount} kali selama sesi.`);
      }

      paragraphs.push(`Rekomendasi Ergonomis: Pastikan monitor berada sejajar dengan tinggi mata dan lakukan istirahat peregangan 20 detik setiap 20 menit (aturan 20-20-20).`);

      return paragraphs.join('\n\n');
    }
  };

  // =========================================================================
  // 4. WEBRTC CAMERA MANAGER
  // =========================================================================
  class CameraManager {
    constructor(videoEl) {
      this.videoEl = videoEl;
      this.stream = null;
      this.isActive = false;
      this.errorMessage = null;

      this.frameCount = 0;
      this.lastFpsTime = performance.now();
      this.currentFps = 0;
    }

    async startCamera() {
      this.errorMessage = null;

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        this.errorMessage = 'Browser ini tidak mendukung WebRTC API. Gunakan Chrome, Edge, atau Firefox terbaru.';
        return false;
      }

      try {
        const constraints = {
          audio: false,
          video: {
            facingMode: 'user',
            width: { ideal: 1280, min: 640 },
            height: { ideal: 720, min: 480 }
          }
        };

        this.stream = await navigator.mediaDevices.getUserMedia(constraints);
        this.videoEl.srcObject = this.stream;
        
        // Wait for video metadata to load
        await new Promise((resolve) => {
          this.videoEl.onloadedmetadata = () => {
            this.videoEl.play();
            resolve(true);
          };
        });

        this.isActive = true;
        return true;
      } catch (err) {
        console.error('Camera Access Error:', err);
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          this.errorMessage = 'Izin akses kamera ditolak. Silakan klik ikon gembok di sebelah URL browser dan ubah Kamera ke "Allow", lalu muat ulang halaman.';
        } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
          this.errorMessage = 'Perangkat kamera tidak ditemukan pada komputer ini.';
        } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
          this.errorMessage = 'Kamera sedang digunakan oleh aplikasi lain (seperti Zoom, Teams, dll). Tutup aplikasi tersebut terlebih dahulu.';
        } else {
          this.errorMessage = 'Gagal mengakses webcam: ' + (err.message || err.name);
        }
        return false;
      }
    }

    stopCamera() {
      if (this.stream) {
        this.stream.getTracks().forEach((track) => track.stop());
        this.stream = null;
      }
      this.isActive = false;
    }

    tickFps() {
      this.frameCount++;
      const now = performance.now();
      const elapsed = now - this.lastFpsTime;
      if (elapsed >= 1000) {
        this.currentFps = Math.round((this.frameCount * 1000) / elapsed * 10) / 10;
        this.frameCount = 0;
        this.lastFpsTime = now;
      }
      return this.currentFps;
    }
  }

  // =========================================================================
  // 5. ADVANCED COMPUTER VISION ENGINE (FaceDetector + Optical Landmark Yaw/Pitch)
  // =========================================================================
  class VisionEngine {
    constructor() {
      this.analysisCanvas = document.createElement('canvas');
      this.analysisCanvas.width = 240;
      this.analysisCanvas.height = 180;
      this.analysisCtx = this.analysisCanvas.getContext('2d', { willReadFrequently: true });
      this.prevFrameData = null;

      // Native Hardware FaceDetector if supported
      this.nativeDetector = null;
      try {
        if (window.FaceDetector) {
          this.nativeDetector = new window.FaceDetector({ fastMode: true, maxDetectedFaces: 1 });
        }
      } catch (e) {
        this.nativeDetector = null;
      }

      // Calibration Baselines
      this.isCalibrating = false;
      this.calibrationProgress = 0;
      this.calibrationSamples = [];
      this.baseline = {
        cx: 0.5,
        cy: 0.45,
        yawRatio: 0.5,
        pitchRatio: 0.35,
        isReady: false
      };

      // Sustained event tracking
      this.headAwayCount = 0;
      this.phoneCount = 0;
      this.exitCount = 0;
      this.postureChanges = 0;
      this.lastPosture = 'Nominal Seated';
      this.lastAttention = 'Center (Screen)';

      this.phoneDebounce = 0;
      this.awayDebounce = 0;
    }

    startCalibration() {
      this.isCalibrating = true;
      this.calibrationProgress = 0;
      this.calibrationSamples = [];
      this.baseline.isReady = false;
    }

    async analyze(videoEl) {
      if (!videoEl || videoEl.videoWidth === 0) return null;

      const sw = this.analysisCanvas.width;
      const sh = this.analysisCanvas.height;

      this.analysisCtx.drawImage(videoEl, 0, 0, sw, sh);
      const imgData = this.analysisCtx.getImageData(0, 0, sw, sh);
      const data = imgData.data;

      // Check Native Face Detector first if available
      let nativeFace = null;
      if (this.nativeDetector) {
        try {
          const detected = await this.nativeDetector.detect(videoEl);
          if (detected && detected.length > 0) {
            nativeFace = detected[0];
          }
        } catch (e) {}
      }

      // 1. Pixel-level skin/face region luminance clustering
      let skinPixels = 0;
      let sumX = 0, sumY = 0;
      let minX = sw, maxX = 0, minY = sh, maxY = 0;
      let motionPixels = 0;

      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const pixelIdx = i / 4;
        const x = pixelIdx % sw;
        const y = Math.floor(pixelIdx / sw);

        // Enhanced YCbCr & RGB Skin Tone Classifier
        const isSkin = r > 75 && g > 38 && b > 20 &&
                       (r - g) > 10 && r > b &&
                       Math.abs(r - g) > 12 &&
                       (r - Math.min(g, b)) > 15;

        if (isSkin && y < sh * 0.90) {
          skinPixels++;
          sumX += x;
          sumY += y;
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        }

        // Motion analysis
        if (this.prevFrameData) {
          const pr = this.prevFrameData[i];
          const pg = this.prevFrameData[i + 1];
          const pb = this.prevFrameData[i + 2];
          const diff = Math.abs(r - pr) + Math.abs(g - pg) + Math.abs(b - pb);
          if (diff > 50) motionPixels++;
        }
      }

      this.prevFrameData = new Uint8ClampedArray(data);

      const isPersonPresent = (nativeFace !== null) || (skinPixels > (sw * sh * 0.02));
      let personBox = null;
      let attention = 'Center (Screen)';
      let posture = 'Nominal Seated';
      let distraction = 'None';
      let isDistracted = false;

      if (isPersonPresent) {
        let normCx, normCy, normW, normH;

        if (nativeFace && nativeFace.boundingBox) {
          const bb = nativeFace.boundingBox;
          normCx = (bb.x + bb.width / 2) / videoEl.videoWidth;
          normCy = (bb.y + bb.height / 2) / videoEl.videoHeight;
          normW = bb.width / videoEl.videoWidth;
          normH = bb.height / videoEl.videoHeight;
        } else {
          normCx = (sumX / Math.max(1, skinPixels)) / sw;
          normCy = (sumY / Math.max(1, skinPixels)) / sh;
          normW = Math.max(0.22, (maxX - minX) / sw);
          normH = Math.max(0.28, (maxY - minY) / sh);
        }

        personBox = {
          normX: Math.max(0.02, normCx - normW / 2),
          normY: Math.max(0.02, normCy - normH / 2),
          normWidth: Math.min(0.96, normW),
          normHeight: Math.min(0.96, normH),
          cx: normCx,
          cy: normCy
        };

        // --- Optical Landmark Analysis within Head Region ---
        const headX1 = Math.floor(personBox.normX * sw);
        const headY1 = Math.floor(personBox.normY * sh);
        const headW = Math.max(10, Math.floor(personBox.normWidth * sw));
        const headH = Math.max(10, Math.floor(personBox.normHeight * sh * 0.65)); // top 65% for face

        let leftHemisphereSkin = 0;
        let rightHemisphereSkin = 0;
        let leftLuminance = 0;
        let rightLuminance = 0;
        const midX = headX1 + Math.floor(headW / 2);

        for (let py = headY1; py < headY1 + headH && py < sh; py++) {
          for (let px = headX1; px < headX1 + headW && px < sw; px++) {
            const idx = (py * sw + px) * 4;
            const r = data[idx];
            const g = data[idx + 1];
            const b = data[idx + 2];
            const lum = 0.299 * r + 0.587 * g + 0.114 * b;
            const isSk = r > 75 && g > 38 && b > 20 && (r - g) > 10 && r > b;

            if (px < midX) {
              if (isSk) leftHemisphereSkin++;
              leftLuminance += lum;
            } else {
              if (isSk) rightHemisphereSkin++;
              rightLuminance += lum;
            }
          }
        }

        const totalFaceSkin = leftHemisphereSkin + rightHemisphereSkin;
        // Yaw asymmetry ratio: 0.5 = symmetrical (facing screen), >0.55 = facing left, <0.45 = facing right
        const yawRatio = totalFaceSkin > 20 ? (leftHemisphereSkin / totalFaceSkin) : 0.50;
        const pitchRatio = normCy;

        // Calibration phase sampling
        if (this.isCalibrating) {
          this.calibrationSamples.push({ cx: normCx, cy: normCy, yaw: yawRatio, pitch: pitchRatio });
          this.calibrationProgress = Math.min(100, Math.round((this.calibrationSamples.length / 60) * 100));

          if (this.calibrationSamples.length >= 60) {
            let avgX = 0, avgY = 0, avgYaw = 0, avgPitch = 0;
            this.calibrationSamples.forEach((s) => {
              avgX += s.cx;
              avgY += s.cy;
              avgYaw += s.yaw;
              avgPitch += s.pitch;
            });
            const tot = this.calibrationSamples.length;
            this.baseline = {
              cx: avgX / tot,
              cy: avgY / tot,
              yawRatio: avgYaw / tot,
              pitchRatio: avgPitch / tot,
              isReady: true
            };
            this.isCalibrating = false;
          }
        }

        // --- Posture Estimation ---
        const baseCy = this.baseline.isReady ? this.baseline.cy : 0.45;
        const dy = normCy - baseCy;
        const motionRatio = motionPixels / (sw * sh);

        if (motionRatio > 0.14) {
          posture = 'Active Movement';
        } else if (dy > 0.07) {
          posture = 'Slouching / Leaning';
        } else if (dy < -0.10) {
          posture = 'Standing / Elevated';
        } else {
          posture = 'Nominal Seated';
        }

        if (posture !== this.lastPosture) {
          this.postureChanges++;
          this.lastPosture = posture;
        }

        // --- Head & Attention Direction Estimation ---
        const baseYaw = this.baseline.isReady ? this.baseline.yawRatio : 0.50;
        const deltaYaw = yawRatio - baseYaw;
        const basePitch = this.baseline.isReady ? this.baseline.pitchRatio : 0.45;
        const deltaPitch = normCy - basePitch;

        // Native landmarks check if available
        if (nativeFace && nativeFace.landmarks && nativeFace.landmarks.length >= 3) {
          const nose = nativeFace.landmarks.find((l) => l.type === 'nose');
          const eyes = nativeFace.landmarks.filter((l) => l.type === 'eye');
          if (nose && eyes.length >= 2) {
            const eyeLeft = eyes[0].locations ? eyes[0].locations[0] : eyes[0].location;
            const eyeRight = eyes[1].locations ? eyes[1].locations[0] : eyes[1].location;
            const eyeSpan = Math.abs(eyeRight.x - eyeLeft.x);
            const noseDist = (nose.location ? nose.location.x : nose.locations[0].x) - Math.min(eyeLeft.x, eyeRight.x);
            const nativeYaw = eyeSpan > 0 ? (noseDist / eyeSpan) : 0.5;

            if (nativeYaw > 0.58) {
              attention = 'Turned Left';
            } else if (nativeYaw < 0.42) {
              attention = 'Turned Right';
            } else if (deltaPitch > 0.06) {
              attention = 'Looking Down (Desk)';
            } else if (deltaPitch < -0.08) {
              attention = 'Looking Up';
            } else {
              attention = 'Center (Screen)';
            }
          }
        } else {
          // Optical dual-hemisphere landmark evaluation
          if (deltaYaw > 0.08) {
            attention = 'Turned Left';
          } else if (deltaYaw < -0.08) {
            attention = 'Turned Right';
          } else if (deltaPitch > 0.065) {
            attention = 'Looking Down (Desk)';
          } else if (deltaPitch < -0.08) {
            attention = 'Looking Up';
          } else {
            attention = 'Center (Screen)';
          }
        }

        if (attention !== 'Center (Screen)' && this.lastAttention === 'Center (Screen)') {
          this.headAwayCount++;
        }
        this.lastAttention = attention;

        // --- Smartphone & Sustained Distraction Heuristic ---
        if (attention === 'Looking Down (Desk)' && normH < 0.42) {
          this.phoneDebounce++;
          if (this.phoneDebounce > 35) { // ~2 seconds
            distraction = 'Smartphone Interaction';
            isDistracted = true;
            this.phoneCount++;
            this.phoneDebounce = 0;
          }
        } else {
          this.phoneDebounce = Math.max(0, this.phoneDebounce - 1);
        }

      } else {
        posture = 'Workspace Exit / Absent';
        attention = 'Away';
        distraction = 'Workspace Departure';
        isDistracted = true;

        this.awayDebounce++;
        if (this.awayDebounce === 25) {
          this.exitCount++;
        }
      }

        return {
          isPersonPresent,
          personBox,
          posture,
          attention,
          distraction,
          isDistracted
        };
      }
    }

  // =========================================================================
  // 6. MASTER FOCUSGUARD APPLICATION CONTROLLER
  // =========================================================================
  class FocusGuardApp {
    constructor() {
      // DOM Elements
      this.videoEl = document.getElementById('webcamVideo');
      this.overlayCanvas = document.getElementById('overlayCanvas');
      this.timelineCanvas = document.getElementById('timelineCanvas');
      this.overlayCtx = this.overlayCanvas ? this.overlayCanvas.getContext('2d') : null;
      this.timelineCtx = this.timelineCanvas ? this.timelineCanvas.getContext('2d') : null;

      // Buttons
      this.startBtn = document.getElementById('startBtn');
      this.pauseBtn = document.getElementById('pauseBtn');
      this.stopBtn = document.getElementById('stopBtn');
      this.calibrateBtn = document.getElementById('calibrateBtn');
      this.exportJsonBtn = document.getElementById('exportJsonBtn');
      this.exportCsvBtn = document.getElementById('exportCsvBtn');
      this.clearHistoryBtn = document.getElementById('clearHistoryBtn');
      this.closeReportBtn = document.getElementById('closeReportBtn');
      this.modalCloseActionBtn = document.getElementById('modalCloseActionBtn');

      // Badges & Telemetry Displays
      this.cameraStatusBadge = document.getElementById('cameraStatusBadge');
      this.cameraErrorBanner = document.getElementById('cameraErrorBanner');
      this.cameraErrorMessage = document.getElementById('cameraErrorMessage');
      this.fpsValue = document.getElementById('fpsValue');
      this.sessionTimer = document.getElementById('sessionTimer');
      this.scoreNumber = document.getElementById('scoreNumber');
      this.scoreRing = document.getElementById('scoreRing');
      this.scoreStatusDesc = document.getElementById('scoreStatusDesc');
      this.postureValue = document.getElementById('postureValue');
      this.attentionValue = document.getElementById('attentionValue');
      this.distractionValue = document.getElementById('distractionValue');
      this.distractionAlert = document.getElementById('distractionAlert');
      this.distractionAlertText = document.getElementById('distractionAlertText');
      this.currentStreak = document.getElementById('currentStreak');
      this.historyList = document.getElementById('historyList');
      this.historyCount = document.getElementById('historyCount');
      this.achievementsList = document.getElementById('achievementsList');

      // Calibration Overlay
      this.calibrationOverlay = document.getElementById('calibrationOverlay');
      this.calibrationCountdown = document.getElementById('calibrationCountdown');
      this.calibrationProgressCircle = document.getElementById('calibrationProgressCircle');

      // Report Modal Elements
      this.reportModal = document.getElementById('reportModal');
      this.reportScore = document.getElementById('reportScore');
      this.reportFocusTime = document.getElementById('reportFocusTime');
      this.reportDistractedTime = document.getElementById('reportDistractedTime');
      this.reportNarrative = document.getElementById('reportNarrative');
      this.reportPostureSummary = document.getElementById('reportPostureSummary');
      this.reportAttentionSummary = document.getElementById('reportAttentionSummary');

      // Engines
      this.cameraManager = new CameraManager(this.videoEl);
      this.visionEngine = new VisionEngine();

      // Session State
      this.isSessionActive = false;
      this.isPaused = false;
      this.elapsedSeconds = 0;
      this.timerInterval = null;
      this.animFrameId = null;
      this.snapshots = [];

      this.initEvents();
      this.renderProfileAndHistory();
    }

    initEvents() {
      const self = this;

      if (this.startBtn) {
        this.startBtn.addEventListener('click', () => self.startSession());
      }
      if (this.pauseBtn) {
        this.pauseBtn.addEventListener('click', () => self.togglePause());
      }
      if (this.stopBtn) {
        this.stopBtn.addEventListener('click', () => self.endSession());
      }
      if (this.calibrateBtn) {
        this.calibrateBtn.addEventListener('click', () => self.visionEngine.startCalibration());
      }
      if (this.closeReportBtn) {
        this.closeReportBtn.addEventListener('click', () => self.closeReport());
      }
      if (this.modalCloseActionBtn) {
        this.modalCloseActionBtn.addEventListener('click', () => self.closeReport());
      }
      if (this.exportJsonBtn) {
        this.exportJsonBtn.addEventListener('click', () => self.exportJSON());
      }
      if (this.exportCsvBtn) {
        this.exportCsvBtn.addEventListener('click', () => self.exportCSV());
      }
      if (this.clearHistoryBtn) {
        this.clearHistoryBtn.addEventListener('click', () => self.clearHistory());
      }
      if (this.reportModal) {
        this.reportModal.addEventListener('click', (e) => {
          if (e.target === self.reportModal) self.closeReport();
        });
      }

      window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') self.closeReport();
      });

      window.addEventListener('resize', () => self.syncCanvasSize());
    }

    async startSession() {
      if (this.cameraErrorBanner) this.cameraErrorBanner.style.display = 'none';

      if (!this.cameraManager.isActive) {
        if (this.cameraStatusBadge) {
          this.cameraStatusBadge.innerText = 'Connecting Camera...';
          this.cameraStatusBadge.style.color = '#f59e0b';
        }

        const success = await this.cameraManager.startCamera();
        if (!success) {
          if (this.cameraErrorBanner) this.cameraErrorBanner.style.display = 'block';
          if (this.cameraErrorMessage) this.cameraErrorMessage.innerText = this.cameraManager.errorMessage || 'Izin kamera gagal.';
          if (this.cameraStatusBadge) {
            this.cameraStatusBadge.innerText = 'Camera Error';
            this.cameraStatusBadge.style.color = '#f43f5e';
          }
          return;
        }

        if (this.cameraStatusBadge) {
          this.cameraStatusBadge.innerText = 'Camera Active (Live)';
          this.cameraStatusBadge.style.color = '#10b981';
          this.cameraStatusBadge.style.background = 'rgba(16, 185, 129, 0.15)';
        }
      }

      this.isSessionActive = true;
      this.isPaused = false;
      this.elapsedSeconds = 0;
      this.snapshots = [];

      this.visionEngine.startCalibration();

      this.startBtn.disabled = true;
      this.pauseBtn.disabled = false;
      this.stopBtn.disabled = false;

      this.startTimer();
      this.startProcessingLoop();
    }

    togglePause() {
      this.isPaused = !this.isPaused;
      if (this.pauseBtn) {
        this.pauseBtn.innerHTML = this.isPaused ? '<span>▶ Resume</span>' : '<span>⏸ Pause</span>';
      }
      if (this.scoreStatusDesc) {
        this.scoreStatusDesc.innerText = this.isPaused ? 'Session Paused.' : 'Analyzing live visual focus...';
      }
    }

    startTimer() {
      if (this.timerInterval) clearInterval(this.timerInterval);
      this.timerInterval = setInterval(() => {
        if (this.isSessionActive && !this.isPaused) {
          this.elapsedSeconds++;
          this.updateTimerDisplay();
        }
      }, 1000);
    }

    updateTimerDisplay() {
      const h = Math.floor(this.elapsedSeconds / 3600);
      const m = Math.floor((this.elapsedSeconds % 3600) / 60);
      const s = this.elapsedSeconds % 60;
      if (this.sessionTimer) {
        this.sessionTimer.innerText = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
      }
    }

    startProcessingLoop() {
      const self = this;
      let isProcessing = false;

      const loop = async () => {
        if (!self.isSessionActive) return;

        const fps = self.cameraManager.tickFps();
        if (self.fpsValue) self.fpsValue.innerText = `${fps.toFixed(1)} FPS`;

        if (!self.isPaused && !isProcessing) {
          isProcessing = true;
          try {
            await self.processFrame();
          } catch (e) {
            console.error('Frame processing error:', e);
          } finally {
            isProcessing = false;
          }
        }

        self.animFrameId = requestAnimationFrame(loop);
      };

      this.animFrameId = requestAnimationFrame(loop);
    }

    async processFrame() {
      if (!this.videoEl || this.videoEl.readyState < 2 || !this.overlayCtx) return;

      this.syncCanvasSize();
      const w = this.overlayCanvas.width;
      const h = this.overlayCanvas.height;
      this.overlayCtx.clearRect(0, 0, w, h);

      const result = await this.visionEngine.analyze(this.videoEl);
      if (!result) return;

      // Handle Calibration Overlay
      if (this.visionEngine.isCalibrating) {
        if (this.calibrationOverlay) this.calibrationOverlay.classList.remove('hidden');
        const remainingSec = Math.max(1, Math.ceil(5 * (1 - this.visionEngine.calibrationProgress / 100)));
        if (this.calibrationCountdown) this.calibrationCountdown.innerText = `${remainingSec}s`;
        if (this.calibrationProgressCircle) {
          const offset = 264 * (1 - this.visionEngine.calibrationProgress / 100);
          this.calibrationProgressCircle.style.strokeDashoffset = offset;
        }
      } else {
        if (this.calibrationOverlay) this.calibrationOverlay.classList.add('hidden');
      }

      // Record snapshot once per second
      if (this.snapshots.length === 0 || this.elapsedSeconds > this.snapshots[this.snapshots.length - 1].timestamp) {
        this.snapshots.push({
          timestamp: this.elapsedSeconds,
          posture: result.posture,
          attention: result.attention,
          distraction: result.distraction,
          isDistracted: result.isDistracted,
          isPersonPresent: result.isPersonPresent
        });
      }

      // Draw Video HUD & Bounding Box (mirrored coordinate compensation)
      this.drawHUDOverlay(result, w, h);

      // Render Multi-layer Timeline
      this.renderTimeline();

      // Update Telemetry Indicators
      this.updateHUDValues(result);
    }

    drawHUDOverlay(res, w, h) {
      if (!this.overlayCtx) return;
      const ctx = this.overlayCtx;

      if (res.personBox) {
        // Because video is mirrored with scaleX(-1), map x coordinate correctly
        const boxX = w - (res.personBox.normX * w + res.personBox.normWidth * w);
        const boxY = res.personBox.normY * h;
        const boxW = res.personBox.normWidth * w;
        const boxH = res.personBox.normHeight * h;

        const isAlert = res.isDistracted || res.posture === 'Slouching / Leaning';
        const strokeColor = isAlert ? '#f43f5e' : '#10b981';

        // High-tech Corner Brackets
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = 3;
        const corner = Math.min(boxW, boxH) * 0.2;

        ctx.beginPath();
        // Top-left
        ctx.moveTo(boxX, boxY + corner); ctx.lineTo(boxX, boxY); ctx.lineTo(boxX + corner, boxY);
        // Top-right
        ctx.moveTo(boxX + boxW - corner, boxY); ctx.lineTo(boxX + boxW, boxY); ctx.lineTo(boxX + boxW, boxY + corner);
        // Bottom-left
        ctx.moveTo(boxX, boxY + boxH - corner); ctx.lineTo(boxX, boxY + boxH); ctx.lineTo(boxX + corner, boxY + boxH);
        // Bottom-right
        ctx.moveTo(boxX + boxW - corner, boxY + boxH); ctx.lineTo(boxX + boxW, boxY + boxH); ctx.lineTo(boxX + boxW, boxY + boxH - corner);
        ctx.stroke();

        // Label Pill
        const label = `${res.posture} • ${res.attention}`;
        ctx.font = 'bold 12px "Outfit", sans-serif';
        const labelWidth = ctx.measureText(label).width;
        const labelY = Math.max(12, boxY - 28);

        ctx.fillStyle = 'rgba(10, 13, 20, 0.85)';
        ctx.beginPath();
        ctx.roundRect(boxX, labelY, labelWidth + 16, 24, 6);
        ctx.fill();
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.fillText(label, boxX + 8, labelY + 16);
      }
    }

    renderTimeline() {
      if (!this.timelineCanvas || !this.timelineCtx) return;
      const ctx = this.timelineCtx;
      const w = this.timelineCanvas.width;
      const h = this.timelineCanvas.height;

      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = '#0a0d14';
      ctx.fillRect(0, 0, w, h);

      if (this.snapshots.length === 0) return;

      const totalSamples = Math.max(30, this.snapshots.length);
      const blockWidth = Math.max(2, w / totalSamples);

      this.snapshots.forEach((s, idx) => {
        const x = (idx / totalSamples) * w;
        let color = '#10b981'; // High focus

        if (!s.isPersonPresent) {
          color = '#64748b'; // Away
        } else if (s.isDistracted || s.distraction !== 'None') {
          color = '#f43f5e'; // Distraction
        } else if (s.attention !== 'Center (Screen)' || s.posture === 'Slouching / Leaning') {
          color = '#f59e0b'; // Shifted
        }

        ctx.fillStyle = color;
        ctx.fillRect(x, 10, blockWidth, h - 20);
      });
    }

    updateHUDValues(res) {
      if (this.postureValue) this.postureValue.innerText = res.posture;
      if (this.attentionValue) this.attentionValue.innerText = res.attention;
      if (this.distractionValue) this.distractionValue.innerText = res.distraction;

      if (this.distractionAlert) {
        if (res.isDistracted) {
          if (this.distractionAlertText) this.distractionAlertText.innerText = `Observasi: ${res.distraction}`;
          this.distractionAlert.classList.add('active');
        } else {
          this.distractionAlert.classList.remove('active');
        }
      }

      // Live Instant Score Calculation
      const stats = FocusPatternEngine.analyzeSnapshots(this.snapshots);
      const liveScore = FocusPatternEngine.calculateScore(
        this.elapsedSeconds,
        stats.activeFocusSec,
        this.visionEngine.phoneCount,
        this.visionEngine.exitCount,
        this.visionEngine.headAwayCount,
        stats.slouchSec
      );

      if (this.scoreNumber) this.scoreNumber.innerText = liveScore.toString();
      if (this.scoreRing) {
        const offset = 251.2 * (1 - liveScore / 100);
        this.scoreRing.style.strokeDashoffset = offset;
        this.scoreRing.style.stroke = liveScore >= 80 ? '#10b981' : (liveScore >= 60 ? '#f59e0b' : '#f43f5e');
      }
      if (this.scoreStatusDesc) {
        this.scoreStatusDesc.innerText = liveScore >= 80 ? 'Pola fokus optimal teramati.' : (liveScore >= 60 ? 'Fokus moderat dengan pergeseran perhatian.' : 'Terdeteksi banyak distraksi visual.');
      }
    }

    endSession() {
      try {
        this.isSessionActive = false;
        this.isPaused = false;
        
        if (this.timerInterval) clearInterval(this.timerInterval);
        if (this.animFrameId) cancelAnimationFrame(this.animFrameId);
        
        // Stop Camera & release hardware
        if (this.cameraManager) {
          this.cameraManager.stopCamera();
        }

        // Hide calibration overlay if active
        if (this.calibrationOverlay) {
          this.calibrationOverlay.classList.add('hidden');
        }

        // Clear overlay canvas
        if (this.overlayCtx && this.overlayCanvas) {
          this.overlayCtx.clearRect(0, 0, this.overlayCanvas.width, this.overlayCanvas.height);
        }

        // Reset camera status badge
        if (this.cameraStatusBadge) {
          this.cameraStatusBadge.innerText = 'Camera Standby';
          this.cameraStatusBadge.style.color = '#94a3b8';
          this.cameraStatusBadge.style.background = 'rgba(100, 116, 139, 0.2)';
        }

        // Reset distraction banner
        if (this.distractionAlert) {
          this.distractionAlert.classList.remove('active');
        }

        // Calculate final focus scores
        const stats = FocusPatternEngine.analyzeSnapshots(this.snapshots || []);
        const phoneCount = (this.visionEngine && this.visionEngine.phoneCount) || 0;
        const exitCount = (this.visionEngine && this.visionEngine.exitCount) || 0;
        const headAwayCount = (this.visionEngine && this.visionEngine.headAwayCount) || 0;
        const postureChanges = (this.visionEngine && this.visionEngine.postureChanges) || 0;

        const finalScore = FocusPatternEngine.calculateScore(
          Math.max(1, this.elapsedSeconds),
          stats.activeFocusSec,
          phoneCount,
          exitCount,
          headAwayCount,
          stats.slouchSec
        );

        const report = {
          id: 'session_' + Date.now(),
          date: new Date().toLocaleDateString('id-ID', { dateStyle: 'medium', timeStyle: 'short' }),
          durationSeconds: Math.max(1, this.elapsedSeconds),
          activeFocusSeconds: stats.activeFocusSec || 0,
          distractedSeconds: stats.distractedSec || 0,
          focusScore: finalScore,
          phoneCount: phoneCount,
          exitCount: exitCount,
          headAwayCount: headAwayCount,
          postureChangeCount: postureChanges,
          summaryNarrative: '',
          timeline: this.snapshots || []
        };

        try {
          report.summaryNarrative = AISummaryGenerator.generateSummary(report);
        } catch (e) {
          report.summaryNarrative = `Sesi fokus berdurasi ${Math.max(1, Math.round(report.durationSeconds / 60))} menit selesai dengan skor fokus ${report.focusScore}/100.`;
        }

        try {
          LocalStore.saveSession(report);
        } catch (e) {
          console.warn('Could not save session to LocalStore:', e);
        }

        // Reset control buttons
        if (this.startBtn) this.startBtn.disabled = false;
        if (this.pauseBtn) {
          this.pauseBtn.disabled = true;
          this.pauseBtn.innerHTML = '<span>⏸ Pause</span>';
        }
        if (this.stopBtn) this.stopBtn.disabled = true;

        this.renderProfileAndHistory();
        this.showReportModal(report);
      } catch (err) {
        console.error('Error during endSession:', err);
        // Ensure buttons reset even if error occurs
        if (this.startBtn) this.startBtn.disabled = false;
        if (this.pauseBtn) this.pauseBtn.disabled = true;
        if (this.stopBtn) this.stopBtn.disabled = true;
      }
    }

    showReportModal(report) {
      if (!this.reportModal) return;

      const formatMinSec = (sec) => {
        const m = Math.floor(sec / 60);
        const s = sec % 60;
        return `${m}m ${s}s`;
      };

      if (this.reportScore) this.reportScore.innerText = `${report.focusScore}/100`;
      if (this.reportFocusTime) this.reportFocusTime.innerText = formatMinSec(report.activeFocusSeconds);
      if (this.reportDistractedTime) this.reportDistractedTime.innerText = formatMinSec(report.distractedSeconds);
      if (this.reportNarrative) this.reportNarrative.innerText = report.summaryNarrative;
      if (this.reportPostureSummary) this.reportPostureSummary.innerText = `Penyesuaian postur tubuh: ${report.postureChangeCount} kali`;
      if (this.reportAttentionSummary) this.reportAttentionSummary.innerText = `Pergeseran pandangan: ${report.headAwayCount} kali • Smartphone: ${report.phoneCount} kali`;

      this.reportModal.classList.add('open');
    }

    closeReport() {
      if (this.reportModal) this.reportModal.classList.remove('open');
    }

    renderProfileAndHistory() {
      const profile = LocalStore.getProfile();
      const sessions = LocalStore.getSessions();

      if (this.currentStreak) this.currentStreak.innerText = `${profile.currentStreak || 1} Days`;
      if (this.historyCount) this.historyCount.innerText = sessions.length.toString();

      if (this.historyList) {
        if (sessions.length === 0) {
          this.historyList.innerHTML = `<div style="color: var(--text-muted); font-size: 0.85rem; padding: 1rem; text-align: center;">Belum ada sesi tercatat di perangkat ini. Selesaikan satu sesi untuk melihat riwayat.</div>`;
        } else {
          this.historyList.innerHTML = sessions.slice(0, 10).map((s) => {
            const badgeClass = s.focusScore >= 80 ? 'badge-high' : (s.focusScore >= 60 ? 'badge-mod' : 'badge-low');
            
            const formatDuration = (totalSec) => {
              if (!totalSec || totalSec < 60) return `${totalSec || 1} detik`;
              const m = Math.floor(totalSec / 60);
              const sec = totalSec % 60;
              return sec > 0 ? `${m}m ${sec}s` : `${m} menit`;
            };

            const durStr = formatDuration(s.durationSeconds);
            const focStr = formatDuration(s.activeFocusSeconds);

            return `
              <div class="history-item">
                <div style="flex: 1;">
                  <strong style="color: #f8fafc; font-size: 0.85rem;">${s.date}</strong>
                  <div style="font-size: 0.75rem; color: #94a3b8; margin-top: 0.15rem;">
                    Durasi: <span style="color: #cbd5e1;">${durStr}</span> • Fokus: <span style="color: #10b981;">${focStr}</span>
                  </div>
                </div>
                <span class="badge-pill ${badgeClass}">${s.focusScore} FPS</span>
              </div>
            `;
          }).join('');
        }
      }

      if (this.achievementsList) {
        const badges = [
          { name: 'First Session', icon: '🏁', unlocked: profile.milestones.firstSession, desc: 'Memulai sesi pertama' },
          { name: 'Zen Master', icon: '🧘', unlocked: profile.milestones.zenMaster, desc: 'Skor fokus >= 85' },
          { name: 'Deep Work', icon: '⏱️', unlocked: profile.milestones.thirtyMinSession, desc: 'Sesi >= 25 menit' },
          { name: 'Consistency', icon: '🔥', unlocked: profile.completedSessions >= 5, desc: '5 sesi selesai' }
        ];

        this.achievementsList.innerHTML = badges.map((b) => `
          <div style="padding: 0.6rem; border-radius: 8px; background: ${b.unlocked ? 'rgba(99, 102, 241, 0.15)' : 'rgba(255,255,255,0.02)'}; border: 1px solid ${b.unlocked ? 'rgba(99, 102, 241, 0.4)' : 'var(--glass-border)'}; text-align: center; opacity: ${b.unlocked ? '1' : '0.4'};">
            <div style="font-size: 1.4rem;">${b.icon}</div>
            <div style="font-size: 0.75rem; font-weight: 700; margin-top: 0.2rem;">${b.name}</div>
            <div style="font-size: 0.65rem; color: var(--text-muted);">${b.desc}</div>
          </div>
        `).join('');
      }
    }

    exportJSON() {
      const sessions = LocalStore.getSessions();
      const blob = new Blob([JSON.stringify(sessions, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `focusguard_sessions_${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
    }

    exportCSV() {
      const sessions = LocalStore.getSessions();
      if (sessions.length === 0) {
        alert('Tidak ada riwayat sesi untuk diekspor.');
        return;
      }

      const headers = ['ID', 'Date', 'DurationSeconds', 'ActiveFocusSeconds', 'FocusScore', 'PhoneCount', 'ExitCount', 'HeadAwayCount', 'PostureChanges'];
      const rows = sessions.map((s) => [
        s.id,
        `"${s.date}"`,
        s.durationSeconds,
        s.activeFocusSeconds,
        s.focusScore,
        s.phoneCount,
        s.exitCount,
        s.headAwayCount,
        s.postureChangeCount
      ]);

      const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `focusguard_sessions_${Date.now()}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    }

    clearHistory() {
      if (confirm('Hapus semua riwayat sesi dan data fokus di perangkat ini?')) {
        LocalStore.deleteAllData();
        this.renderProfileAndHistory();
      }
    }

    syncCanvasSize() {
      if (!this.videoEl || !this.overlayCanvas) return;
      const w = this.videoEl.clientWidth || 640;
      const h = this.videoEl.clientHeight || 480;

      if (this.overlayCanvas.width !== w || this.overlayCanvas.height !== h) {
        this.overlayCanvas.width = w;
        this.overlayCanvas.height = h;
      }

      if (this.timelineCanvas) {
        const tw = this.timelineCanvas.parentElement ? this.timelineCanvas.parentElement.clientWidth : 600;
        if (this.timelineCanvas.width !== tw) {
          this.timelineCanvas.width = tw;
          this.timelineCanvas.height = 120;
        }
      }
    }
  }

  // Auto-init on page load
  window.addEventListener('DOMContentLoaded', () => {
    window.FocusGuard = new FocusGuardApp();
  });
})();
