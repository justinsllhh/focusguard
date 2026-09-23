// ============================================================================
// FOCUSGUARD AI — OBSERVATIONAL AI SUMMARY TEXT GENERATOR
// Strictly generates factual, objective, non-psychological activity narratives
// ============================================================================

import { SessionReportData } from '../types';

export class AISummaryGenerator {
  /**
   * Generate an objective observational summary based on session statistics.
   */
  static generateSummary(data: SessionReportData): string {
    const totalMin = Math.max(1, Math.round(data.durationSeconds / 60));
    const focusMin = Math.round(data.activeFocusSeconds / 60);
    const focusPercent = Math.round((data.activeFocusSeconds / Math.max(1, data.durationSeconds)) * 100);

    const paragraphs: string[] = [];

    // 1. Presence observation
    if (focusPercent >= 80) {
      paragraphs.push(`Selama sesi ${totalMin} menit ini, Anda tetap berada di area kerja secara konsisten (sekitar ${focusPercent}% waktu teramati).`);
    } else {
      paragraphs.push(`Pada sesi berdurasi ${totalMin} menit ini, aktivitas kerja teramati selama sekitar ${focusMin} menit (${focusPercent}% dari total durasi).`);
    }

    // 2. Observations on distractions & head attention
    const obsList: string[] = [];
    if (data.phoneDetectionCount > 0) {
      obsList.push(`objek smartphone terdeteksi sebanyak ${data.phoneDetectionCount} kali`);
    }
    if (data.workspaceExitsCount > 0) {
      obsList.push(`Anda meninggalkan area kamera sebanyak ${data.workspaceExitsCount} kali`);
    }
    if (data.headAwayCount > 3) {
      obsList.push(`arah pandangan kepala berpaling dari layar kerja beberapa kali`);
    }

    if (obsList.length > 0) {
      paragraphs.push(`Observasi visual mencatat: ${obsList.join(', ')}.`);
    } else {
      paragraphs.push(`Tidak teramati adanya distraksi perangkat eksternal yang signifikan selama sesi berlangsung.`);
    }

    // 3. Posture stability
    if (data.postureChangeCount > 10) {
      paragraphs.push(`Teramati variasi perubahan postur duduk/berdiri sebanyak ${data.postureChangeCount} kali, yang menunjukkan penyesuaian posisi berkala.`);
    }

    return paragraphs.join(' ');
  }
}
