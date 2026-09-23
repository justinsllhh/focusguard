// ============================================================================
// FOCUSGUARD AI — LOCAL STORAGE, STREAKS & MILESTONE MANAGER
// 100% Client-Side Local Storage & Privacy Management
// ============================================================================

import { SessionReportData, UserGamificationProfile } from '../types';

export class LocalStore {
  private static SESSIONS_KEY = 'focusguard_sessions';
  private static PROFILE_KEY = 'focusguard_profile';

  static getSessions(): SessionReportData[] {
    try {
      const data = localStorage.getItem(this.SESSIONS_KEY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  }

  static saveSession(report: SessionReportData): void {
    const sessions = this.getSessions();
    sessions.unshift(report);
    if (sessions.length > 50) sessions.pop(); // Keep last 50 sessions
    localStorage.setItem(this.SESSIONS_KEY, JSON.stringify(sessions));

    this.updateProfile(report);
  }

  static getProfile(): UserGamificationProfile {
    try {
      const data = localStorage.getItem(this.PROFILE_KEY);
      if (data) return JSON.parse(data);
    } catch (e) {}

    return {
      totalFocusMinutes: 0,
      completedSessions: 0,
      currentStreak: 1,
      lastSessionDate: null,
      milestones: {
        firstSession: false,
        thirtyMinSession: false,
        fiveSessions: false,
        tenHoursTotal: false
      }
    };
  }

  private static updateProfile(report: SessionReportData): void {
    const profile = this.getProfile();
    const durationMin = Math.round(report.durationSeconds / 60);

    profile.totalFocusMinutes += durationMin;
    profile.completedSessions += 1;

    // Calculate streak
    const todayStr = new Date().toDateString();
    if (profile.lastSessionDate !== todayStr) {
      profile.currentStreak += 1;
      profile.lastSessionDate = todayStr;
    }

    // Milestones check
    profile.milestones.firstSession = true;
    if (durationMin >= 30) profile.milestones.thirtyMinSession = true;
    if (profile.completedSessions >= 5) profile.milestones.fiveSessions = true;
    if (profile.totalFocusMinutes >= 600) profile.milestones.tenHoursTotal = true;

    localStorage.setItem(this.PROFILE_KEY, JSON.stringify(profile));
  }

  static deleteAllData(): void {
    localStorage.removeItem(this.SESSIONS_KEY);
    localStorage.removeItem(this.PROFILE_KEY);
  }
}
