export type AppScreen =
  | 'home'
  | 'guide'
  | 'mode-select'
  | 'school-mode'
  | 'home-mode'
  | 'techniques'
  | 'records'
  | 'mission-complete';

export type SchoolStage =
  | 'taklimat'
  | 'teknik'
  | 'misi'
  | 'analisis'
  | 'pengesahan';

export type HomeStation =
  | 'keselamatan'
  | 'simulasi'
  | 'detektif'
  | 'kuiz'
  | 'refleksi';

export type CriterionCode = 'K1' | 'K2' | 'K3' | 'K4';

export type TechniqueStatus =
  | 'Memenuhi kriteria berdasarkan gambar'
  | 'Perlu penambahbaikan'
  | 'Tidak dapat dipastikan daripada gambar ini';

export type ConfidenceCategory = 'Tinggi' | 'Sederhana' | 'Rendah';

export type VideoSuitability = 'SESUAI' | 'SEPARUH_SESUAI' | 'TIDAK_SESUAI';

export interface QualityCheckMetric {
  key: string;
  label: string;
  status: 'lulus' | 'amaran' | 'gagal';
  detail: string;
}

export interface VideoQualityReport {
  readable: boolean;
  durationSec: number;
  width: number;
  height: number;
  estimatedFps: number;
  brightnessScore: number; // 0-255 luminance average
  blurScore: number; // edge variance
  stabilityScore: number; // 0-1 frame stability
  motionScore: number; // 0-1 inter-frame runner motion detected
  personVisibleRatio: number; // 0-1
  poseSuccessFrames: number;
  totalSampledFrames: number;
  suitability: VideoSuitability;
  warnings: string[];
  metrics: QualityCheckMetric[];
}

export interface NormalizedLandmark {
  x: number;
  y: number;
  z?: number;
  visibility?: number;
}

export interface SampledPoseKeyframe {
  timestampSec: number;
  dataUrl: string;
  landmarks: NormalizedLandmark[] | null;
  phaseLabel: string;
}

export interface PoseTelemetrySummary {
  poseEngineStatus: 'mediapipe-active' | 'cv-fallback-no-landmarks';
  sampledFramesCount: number;
  detectedPoseFramesCount: number;
  headStabilityNotes: string;
  trunkLeanRangeDeg: { min: number; max: number } | null;
  elbowAngleRangeDeg: { min: number; max: number } | null;
  armAlternationDetected: boolean | null;
  lateralArmDriftHigh: boolean | null;
  kneeLiftRelativeToHip: string;
  strideAlternationDetected: boolean | null;
  footVisibilityNotes: string;
  keyframes: SampledPoseKeyframe[];
}

export interface CriterionAnalysisResult {
  code: CriterionCode;
  name: string;
  observedRegion?: string;
  visibleObservation: string;
  supportingEvidence: string;
  confidence: ConfidenceCategory;
  status: TechniqueStatus;
  note?: string;
  improvementSuggestion: string;
}

export interface FrameAnalysisResult {
  id: string;
  timestampSec: number;
  imageWidth: number;
  imageHeight: number;
  frameDataUrl?: string;
  landmarks: NormalizedLandmark[] | null;
  poseDetected: boolean;
  detectedBodyParts: string[];
  missingBodyParts: string[];
  overallSummaryArif: string;
  overallSummaryAya: string;
  criteria: CriterionAnalysisResult[];
  priorityFocus: string;
  o3CheckPrompt: string;
  analyzedAt: string;
  engineNote: string;
}

export interface SprintAnalysisResult {
  videoSuitability: VideoSuitability;
  selectedTimestampSec?: number;
  evaluatorRole?: 'Guru Pendidikan Jasmani' | 'Murid (Berpandukan Guru)';
  overallNote?: string;
  overallSummaryArif: string;
  overallSummaryAya: string;
  criteria: CriterionAnalysisResult[];
  priorityFocus: string;
  o3CheckPrompt: string;
  analyzedAt: string;
  engineNote: string;
}

export interface AttemptRecord {
  attemptNumber: 1 | 2 | 3;
  completed: boolean;
  fileName?: string;
  qualityReport?: VideoQualityReport;
  analysis?: SprintAnalysisResult;
  frameAnalyses?: FrameAnalysisResult[];
  o3IdentifiedAspect?: string;
  o3ActionPlan?: string;
  updatedAt?: string;
}

export interface QuizQuestion {
  id: string;
  criterion: CriterionCode;
  prompt: string;
  scenario: string;
  options: string[];
  correctIndex: number;
  explanationAya: string;
  tipArif: string;
}

export interface DetectiveCase {
  id: string;
  title: string;
  clue: string;
  focusCriterion: CriterionCode;
  question: string;
  options: string[];
  correctIndex: number;
  feedbackAya: string;
  correctionArif: string;
}

export interface TeacherValidation {
  teacherName: string;
  o1Validated: boolean;
  o2Validated: boolean;
  o3Validated: boolean;
  overallStatus: 'Belum Disahkan' | 'Disahkan Mencapai Tahap' | 'Perlu Bimbingan Lanjut';
  teacherNotes: string;
  validatedAt?: string;
}

export type ActiveMode = 'school' | 'home';

export interface PupilPortfolio {
  activeMode: ActiveMode;
  pupilName: string;
  pupilClass: string;
  safetyAccepted: boolean;
  quickCheckCompleted: boolean;
  quickCheckScore: number;
  homeSafetyChecked: boolean;
  homeDemoCompleted: boolean;
  detectiveCompleted: boolean;
  detectiveScore: number;
  safeChallengeDone: boolean;
  homeQuizAnswers: Record<string, number>;
  homeQuizSubmitted: boolean;
  homeReflectionNote: string;
  attempts: AttemptRecord[];
  teacherValidation: TeacherValidation;
}
