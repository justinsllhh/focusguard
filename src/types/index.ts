// ============================================================================
// FOCUSGUARD AI — TYPESCRIPT TYPE DEFINITIONS
// ============================================================================

export type PostureState =
  | 'Seated'
  | 'Standing'
  | 'Leaning Forward'
  | 'Leaning Backward'
  | 'Movement / Shifting'
  | 'Left Workspace';

export type AttentionDirection =
  | 'Looking toward workspace'
  | 'Looking away'
  | 'Looking left'
  | 'Looking right'
  | 'Looking down';

export type DistractionType =
  | 'None'
  | 'Smartphone'
  | 'Tablet / Second Screen'
  | 'Person Leaving Workspace'
  | 'Multiple People in Frame';

export interface WorkspaceZone {
  x: number;
  y: number;
  width: number;
  height: number;
  isCalibrated: boolean;
}

export interface ActivitySnapshot {
  timestamp: number; // Session elapsed seconds
  posture: PostureState;
  attention: AttentionDirection;
  distraction: DistractionType;
  isDistracted: boolean;
  isPersonPresent: boolean;
}

export interface DistractionEvent {
  id: string;
  type: DistractionType;
  startTime: number;
  durationSeconds: number;
}

export interface SessionReportData {
  id: string;
  date: string;
  durationSeconds: number;
  activeFocusSeconds: number;
  potentialDistractionSeconds: number;
  focusPatternScore: number; // 0 to 100
  phoneDetectionCount: number;
  workspaceExitsCount: number;
  headAwayCount: number;
  postureChangeCount: number;
  aiObservationSummary: string;
  timeline: ActivitySnapshot[];
}

export interface UserGamificationProfile {
  totalFocusMinutes: number;
  completedSessions: number;
  currentStreak: number;
  lastSessionDate: string | null;
  milestones: {
    firstSession: boolean;
    thirtyMinSession: boolean;
    fiveSessions: boolean;
    tenHoursTotal: boolean;
  };
}
