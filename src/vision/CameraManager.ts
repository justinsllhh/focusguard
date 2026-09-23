// ============================================================================
// FOCUSGUARD AI — WEBRTC CAMERA MANAGER & FPS MONITOR
// ============================================================================

export class CameraManager {
  private videoElement: HTMLVideoElement;
  private stream: MediaStream | null = null;
  public isActive = false;
  public errorMessage: string | null = null;

  private frameCount = 0;
  private lastFpsTime = performance.now();
  private currentFps = 0;

  constructor(videoElement: HTMLVideoElement) {
    this.videoElement = videoElement;
  }

  async startCamera(preferredWidth = 1280, preferredHeight = 720): Promise<boolean> {
    this.errorMessage = null;

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      this.errorMessage = "Browser ini tidak mendukung WebRTC camera API (getUserMedia).";
      return false;
    }

    try {
      const constraints: MediaStreamConstraints = {
        audio: false,
        video: {
          facingMode: 'user',
          width: { ideal: preferredWidth, min: 640 },
          height: { ideal: preferredHeight, min: 480 }
        }
      };

      this.stream = await navigator.mediaDevices.getUserMedia(constraints);
      this.videoElement.srcObject = this.stream;
      await this.videoElement.play();
      this.isActive = true;
      return true;
    } catch (err: any) {
      console.error("Camera Manager Error:", err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        this.errorMessage = "Izin kamera ditolak. Silakan izinkan akses kamera di pengaturan browser.";
      } else if (err.name === 'NotFoundError') {
        this.errorMessage = "Perangkat kamera tidak ditemukan.";
      } else if (err.name === 'NotReadableError') {
        this.errorMessage = "Kamera sedang digunakan oleh aplikasi lain.";
      } else {
        this.errorMessage = `Gagal membuka kamera: ${err.message || err.name}`;
      }
      this.isActive = false;
      return false;
    }
  }

  stopCamera(): void {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
    if (this.videoElement) {
      this.videoElement.srcObject = null;
    }
    this.isActive = false;
    this.currentFps = 0;
  }

  tickFps(): number {
    this.frameCount++;
    const now = performance.now();
    const elapsed = now - this.lastFpsTime;

    if (elapsed >= 1000) {
      this.currentFps = Math.round((this.frameCount * 1000) / elapsed);
      this.frameCount = 0;
      this.lastFpsTime = now;
    }

    return this.currentFps;
  }

  getFps(): number {
    return this.currentFps;
  }
}
