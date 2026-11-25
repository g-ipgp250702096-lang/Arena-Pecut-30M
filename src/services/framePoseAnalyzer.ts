import { FilesetResolver, PoseLandmarker } from '@mediapipe/tasks-vision';
import {
  ConfidenceCategory,
  CriterionAnalysisResult,
  FrameAnalysisResult,
  NormalizedLandmark,
  TechniqueStatus,
} from '../types/arena';

let cachedLandmarker: PoseLandmarker | null = null;
let initPromise: Promise<PoseLandmarker | null> | null = null;

async function getSingleFrameLandmarker(): Promise<PoseLandmarker | null> {
  if (cachedLandmarker) return cachedLandmarker;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    try {
      const vision = await FilesetResolver.forVisionTasks('/mediapipe-wasm');
      const landmarker = await Promise.race([
        PoseLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: '/mediapipe-models/pose_landmarker_lite.task',
            delegate: 'CPU',
          },
          runningMode: 'IMAGE',
          numPoses: 1,
          minPoseDetectionConfidence: 0.35,
          minPosePresenceConfidence: 0.35,
          minTrackingConfidence: 0.35,
        }),
        new Promise<null>((resolve) => setTimeout(() => resolve(null), 12000)),
      ]);
      if (landmarker) {
        cachedLandmarker = landmarker;
      }
      return landmarker;
    } catch {
      return null;
    }
  })();

  return initPromise;
}

export interface ExtractedFrame {
  dataUrl: string;
  width: number;
  height: number;
  timestampSec: number;
}

export function extractFrameAtTimestamp(videoEl: HTMLVideoElement): ExtractedFrame {
  const width = videoEl.videoWidth;
  const height = videoEl.videoHeight;
  if (!width || !height) {
    throw new Error('Dimensi video belum tersedia. Pastikan video telah dimuatkan sepenuhnya.');
  }

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Gagal menyediakan Canvas API untuk mengekstrak bingkai video.');
  }

  ctx.drawImage(videoEl, 0, 0, width, height);
  const dataUrl = canvas.toDataURL('image/jpeg', 0.92);

  return {
    dataUrl,
    width,
    height,
    timestampSec: Number((videoEl.currentTime || 0).toFixed(2)),
  };
}

export function isLandmarkUsable(
  lm: NormalizedLandmark | undefined | null,
  minVis = 0.35,
  maxBottomY = 0.992
): lm is NormalizedLandmark {
  if (!lm) return false;
  const vis = lm.visibility ?? 1;
  return (
    vis >= minVis &&
    lm.x >= 0.005 &&
    lm.x <= 0.995 &&
    lm.y >= 0.005 &&
    lm.y <= maxBottomY
  );
}

// Complete full-body skeleton connections: head, torso, arms, legs, heels & toes
export const FULL_BODY_POSE_CONNECTIONS: Array<[number, number]> = [
  // Head & Face
  [7, 2],
  [2, 0],
  [0, 5],
  [5, 8],
  // Torso
  [11, 12],
  [11, 23],
  [12, 24],
  [23, 24],
  // Left Arm
  [11, 13],
  [13, 15],
  // Right Arm
  [12, 14],
  [14, 16],
  // Left Leg
  [23, 25],
  [25, 27],
  // Right Leg
  [24, 26],
  [26, 28],
  // Left Foot (ankle, heel, toe/foot_index)
  [27, 29],
  [29, 31],
  [27, 31],
  // Right Foot (ankle, heel, toe/foot_index)
  [28, 30],
  [30, 32],
  [28, 32],
];

const KEY_BODY_JOINTS = [
  0, 2, 5, 7, 8, 11, 12, 13, 14, 15, 16, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32,
];

export function drawFullBodySkeletonOnCanvas(
  canvas: HTMLCanvasElement,
  dataUrl: string,
  landmarks: NormalizedLandmark[] | null
): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const img = new Image();
  img.onload = () => {
    const natW = img.naturalWidth || img.width;
    const natH = img.naturalHeight || img.height;
    canvas.width = natW;
    canvas.height = natH;
    ctx.clearRect(0, 0, natW, natH);
    ctx.drawImage(img, 0, 0, natW, natH);

    if (!landmarks || landmarks.length < 33) return;

    const minDim = Math.min(natW, natH);
    const lineWidth = Math.max(2.5, minDim * 0.006);
    const dotRadius = Math.max(3.5, minDim * 0.009);

    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Optional neck line connecting nose (0) to shoulder midpoint if both visible
    const nose = landmarks[0];
    const lShoulder = landmarks[11];
    const rShoulder = landmarks[12];
    if (
      isLandmarkUsable(nose, 0.35) &&
      isLandmarkUsable(lShoulder, 0.35) &&
      isLandmarkUsable(rShoulder, 0.35)
    ) {
      const midX = ((lShoulder.x + rShoulder.x) / 2) * natW;
      const midY = ((lShoulder.y + rShoulder.y) / 2) * natH;
      ctx.strokeStyle = 'rgba(38, 185, 209, 0.85)';
      ctx.lineWidth = lineWidth * 0.9;
      ctx.beginPath();
      ctx.moveTo(nose.x * natW, nose.y * natH);
      ctx.lineTo(midX, midY);
      ctx.stroke();
    }

    // Draw all detected body connections in cyan
    ctx.strokeStyle = '#26B9D1';
    ctx.lineWidth = lineWidth;
    for (const [a, b] of FULL_BODY_POSE_CONNECTIONS) {
      const pA = landmarks[a];
      const pB = landmarks[b];
      if (isLandmarkUsable(pA, 0.35) && isLandmarkUsable(pB, 0.35)) {
        ctx.beginPath();
        ctx.moveTo(pA.x * natW, pA.y * natH);
        ctx.lineTo(pB.x * natW, pB.y * natH);
        ctx.stroke();
      }
    }

    // Draw detected joint dots
    for (const idx of KEY_BODY_JOINTS) {
      const pt = landmarks[idx];
      if (!isLandmarkUsable(pt, 0.35)) continue;

      const cx = pt.x * natW;
      const cy = pt.y * natH;
      const isHeadOrFoot = idx === 0 || idx >= 29;

      ctx.fillStyle = isHeadOrFoot ? '#FFC94A' : '#F7F5FC';
      ctx.strokeStyle = '#26B9D1';
      ctx.lineWidth = Math.max(1.5, lineWidth * 0.5);

      ctx.beginPath();
      ctx.arc(cx, cy, isHeadOrFoot ? dotRadius * 1.05 : dotRadius, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }

    ctx.restore();
  };
  img.src = dataUrl;
}

function calcAngleDeg(
  a: NormalizedLandmark,
  b: NormalizedLandmark,
  c: NormalizedLandmark
): number {
  const abx = a.x - b.x;
  const aby = a.y - b.y;
  const cbx = c.x - b.x;
  const cby = c.y - b.y;
  const dot = abx * cbx + aby * cby;
  const magA = Math.hypot(abx, aby);
  const magC = Math.hypot(cbx, cby);
  if (magA === 0 || magC === 0) return 0;
  const cosVal = Math.max(-1, Math.min(1, dot / (magA * magC)));
  return Math.round((Math.acos(cosVal) * 180) / Math.PI);
}

function dist(a: NormalizedLandmark, b: NormalizedLandmark): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function assessCriteriaFromLandmarks(
  lm: NormalizedLandmark[] | null
): {
  poseDetected: boolean;
  detectedBodyParts: string[];
  missingBodyParts: string[];
  criteria: CriterionAnalysisResult[];
  overallSummaryAya: string;
  overallSummaryArif: string;
  priorityFocus: string;
  o3CheckPrompt: string;
} {
  const detectedBodyParts: string[] = [];
  const missingBodyParts: string[] = [];

  if (!lm || lm.length < 33) {
    missingBodyParts.push(
      'Kepala',
      'Bahu',
      'Siku',
      'Pergelangan tangan',
      'Pinggul',
      'Lutut',
      'Buku lali',
      'Tumit & hujung kaki'
    );
    const cannotDetermine: CriterionAnalysisResult[] = [
      {
        code: 'K1',
        name: 'K1 — Kedudukan Kepala',
        observedRegion: 'Kepala, leher, bahu dan badan atas',
        visibleObservation:
          'Model pengesanan pose tidak dapat mengesan badan pelari dengan keyakinan mencukupi pada gambar ini.',
        supportingEvidence: 'Tiada landmark kepala dan bahu yang dapat dikesan.',
        confidence: 'Rendah',
        status: 'Tidak dapat dipastikan daripada gambar ini',
        improvementSuggestion:
          'Pilih detik lain yang lebih jelas, tidak kabur, dan pastikan pelari berada jelas di tengah bingkai.',
      },
      {
        code: 'K2',
        name: 'K2 — Pergerakan Tangan',
        observedRegion: 'Bahu, siku dan pergelangan tangan',
        visibleObservation:
          'Kedudukan lengan, siku dan tangan tidak dapat dikenal pasti daripada bingkai ini.',
        supportingEvidence: 'Pengesanan pose gagal pada detik ini.',
        confidence: 'Rendah',
        status: 'Tidak dapat dipastikan daripada gambar ini',
        improvementSuggestion:
          'Pilih detik lain dengan pencahayaan mencukupi dan keseluruhan lengan kelihatan.',
      },
      {
        code: 'K3',
        name: 'K3 — Pergerakan Kaki',
        observedRegion: 'Pinggul, lutut dan buku lali',
        visibleObservation:
          'Kedudukan pinggul, lutut dan buku lali tidak dapat dikesan daripada gambar ini.',
        supportingEvidence: 'Pengesanan pose gagal pada detik ini.',
        confidence: 'Rendah',
        status: 'Tidak dapat dipastikan daripada gambar ini',
        improvementSuggestion:
          'Pilih detik larian di tempat yang lebih terang dan pastikan bahagian pinggul hingga kaki kelihatan.',
      },
      {
        code: 'K4',
        name: 'K4 — Sentuhan dan Tolakan Kaki',
        observedRegion: 'Buku lali, tumit, hujung tapak kaki (kasut) dan permukaan trek',
        visibleObservation:
          'Bahagian kaki, tumit dan hujung kaki tidak dapat dikenal pasti daripada gambar ini.',
        supportingEvidence: 'Pengesanan pose gagal pada detik ini.',
        confidence: 'Rendah',
        status: 'Tidak dapat dipastikan daripada gambar ini',
        improvementSuggestion:
          'Pilih detik lain yang menampakkan keseluruhan badan dari kepala hingga kasut tanpa halangan.',
      },
    ];

    return {
      poseDetected: false,
      detectedBodyParts,
      missingBodyParts,
      criteria: cannotDetermine,
      overallSummaryAya:
        'Pengesanan pose tidak berjaya mengesan anggota badan pada detik gambar ini atau keyakinan pengesanan terlalu rendah. Pemerhatian tidak dapat dibuat secara tepat.',
      overallSummaryArif:
        'Jangan risau! Tekan butang PILIH DETIK LAIN pada video untuk memilih gambar larian yang lebih terang dan jelas.',
      priorityFocus: 'Pilih detik gambar yang lebih jelas untuk mengesan keseluruhan badan.',
      o3CheckPrompt:
        'Apakah langkah yang perlu dibaiki supaya detik gambar larian kamu lebih mudah diperhatikan?',
    };
  }

  const nose = lm[0];
  const lEye = lm[2];
  const rEye = lm[5];
  const lEar = lm[7];
  const rEar = lm[8];
  const lShoulder = lm[11];
  const rShoulder = lm[12];
  const lElbow = lm[13];
  const rElbow = lm[14];
  const lWrist = lm[15];
  const rWrist = lm[16];
  const lHip = lm[23];
  const rHip = lm[24];
  const lKnee = lm[25];
  const rKnee = lm[26];
  const lAnkle = lm[27];
  const rAnkle = lm[28];
  const lHeel = lm[29];
  const rHeel = lm[30];
  const lToe = lm[31];
  const rToe = lm[32];

  const hasHead = isLandmarkUsable(nose, 0.35);
  const hasShoulders =
    isLandmarkUsable(lShoulder, 0.35) && isLandmarkUsable(rShoulder, 0.35);
  const hasLeftArm =
    isLandmarkUsable(lShoulder, 0.35) &&
    isLandmarkUsable(lElbow, 0.35) &&
    isLandmarkUsable(lWrist, 0.35);
  const hasRightArm =
    isLandmarkUsable(rShoulder, 0.35) &&
    isLandmarkUsable(rElbow, 0.35) &&
    isLandmarkUsable(rWrist, 0.35);
  const hasElbows =
    isLandmarkUsable(lElbow, 0.35) || isLandmarkUsable(rElbow, 0.35);
  const hasWrists =
    isLandmarkUsable(lWrist, 0.35) || isLandmarkUsable(rWrist, 0.35);
  const hasHips = isLandmarkUsable(lHip, 0.35) && isLandmarkUsable(rHip, 0.35);
  const hasLeftLeg =
    isLandmarkUsable(lHip, 0.35) &&
    isLandmarkUsable(lKnee, 0.35) &&
    isLandmarkUsable(lAnkle, 0.35);
  const hasRightLeg =
    isLandmarkUsable(rHip, 0.35) &&
    isLandmarkUsable(rKnee, 0.35) &&
    isLandmarkUsable(rAnkle, 0.35);
  const hasKnees =
    isLandmarkUsable(lKnee, 0.35) || isLandmarkUsable(rKnee, 0.35);
  const hasAnkles =
    isLandmarkUsable(lAnkle, 0.35) || isLandmarkUsable(rAnkle, 0.35);
  const hasLeftFoot =
    isLandmarkUsable(lAnkle, 0.35, 0.985) &&
    (isLandmarkUsable(lHeel, 0.35, 0.988) || isLandmarkUsable(lToe, 0.35, 0.988));
  const hasRightFoot =
    isLandmarkUsable(rAnkle, 0.35, 0.985) &&
    (isLandmarkUsable(rHeel, 0.35, 0.988) || isLandmarkUsable(rToe, 0.35, 0.988));
  const hasHeels =
    isLandmarkUsable(lHeel, 0.35, 0.988) || isLandmarkUsable(rHeel, 0.35, 0.988);
  const hasToes =
    isLandmarkUsable(lToe, 0.35, 0.988) || isLandmarkUsable(rToe, 0.35, 0.988);

  if (hasHead) detectedBodyParts.push('Kepala');
  else missingBodyParts.push('Kepala');

  if (hasShoulders) detectedBodyParts.push('Bahu');
  else missingBodyParts.push('Bahu');

  if (hasElbows) detectedBodyParts.push('Siku');
  else missingBodyParts.push('Siku');

  if (hasWrists) detectedBodyParts.push('Pergelangan tangan');
  else missingBodyParts.push('Pergelangan tangan');

  if (hasHips) detectedBodyParts.push('Pinggul');
  else missingBodyParts.push('Pinggul');

  if (hasKnees) detectedBodyParts.push('Lutut');
  else missingBodyParts.push('Lutut');

  if (hasAnkles) detectedBodyParts.push('Buku lali');
  else missingBodyParts.push('Buku lali');

  if (hasHeels || hasToes) detectedBodyParts.push('Tumit & hujung kaki');
  else missingBodyParts.push('Tumit & hujung kaki');

  const criteria: CriterionAnalysisResult[] = [];

  // -------------------------------------------------------------------------
  // K1 — KEDUDUKAN KEPALA
  // -------------------------------------------------------------------------
  if (!hasHead || !hasShoulders) {
    criteria.push({
      code: 'K1',
      name: 'K1 — Kedudukan Kepala',
      observedRegion: 'Kepala, leher, bahu dan badan atas',
      visibleObservation:
        'Landmark kepala atau bahu tidak dikesan dengan jelas pada gambar ini.',
      supportingEvidence:
        'Bahagian kepala atau bahu mungkin terpotong atau kurang jelas dalam bingkai pilihan.',
      confidence: 'Rendah',
      status: 'Tidak dapat dipastikan daripada gambar ini',
      improvementSuggestion:
        'Pilih detik lain di mana bahagian kepala dan bahu pelari kelihatan penuh tanpa terlindung.',
    });
  } else {
    const midShoulderX = (lShoulder.x + rShoulder.x) / 2;
    const midShoulderY = (lShoulder.y + rShoulder.y) / 2;
    const trunkHeight = hasHips
      ? Math.max(0.08, (lHip.y + rHip.y) / 2 - midShoulderY)
      : 0.25;

    const headLiftRatio = (midShoulderY - nose.y) / trunkHeight;
    const headForwardRatio = Math.abs(nose.x - midShoulderX) / trunkHeight;

    let trunkLeanDeg: number | null = null;
    if (hasHips) {
      const midHipX = (lHip.x + rHip.x) / 2;
      const midHipY = (lHip.y + rHip.y) / 2;
      trunkLeanDeg = Math.round(
        (Math.atan2(Math.abs(midShoulderX - midHipX), Math.max(0.01, midHipY - midShoulderY)) *
          180) /
          Math.PI
      );
    }

    // Check head pitch using ears/eyes if clearly detected
    const visibleEarY = isLandmarkUsable(lEar, 0.4)
      ? lEar.y
      : isLandmarkUsable(rEar, 0.4)
        ? rEar.y
        : null;
    const headDroppingLow = headLiftRatio < 0.16;
    const headTiltedDown =
      visibleEarY !== null && nose.y - visibleEarY > trunkHeight * 0.14;
    const excessiveBackwardLean =
      trunkLeanDeg !== null && trunkLeanDeg > 38;

    const hasClearEyes =
      isLandmarkUsable(lEye, 0.55) &&
      isLandmarkUsable(rEye, 0.55) &&
      Math.abs(lEye.x - rEye.x) > 0.015;

    const gazeNote = hasClearEyes
      ? 'Kedudukan mata sejajar dan menghadap laluan hadapan.'
      : 'Arah pandangan mata tepat tidak dapat disahkan sepenuhnya dari sudut gambar pegun ini; penilaian berasaskan penjajaran kepala dan bahu.';

    let k1Status: TechniqueStatus = 'Memenuhi kriteria berdasarkan gambar';
    let k1Observation =
      'Kepala berada dalam kedudukan tegak dan sejajar di atas garisan bahu dengan postur badan yang seimbang.';
    let k1Suggestion =
      'Kekalkan kepala tegak secara semula jadi dengan pandangan terus ke hadapan sepanjang larian.';

    if (headDroppingLow || headTiltedDown) {
      k1Status = 'Perlu penambahbaikan';
      k1Observation =
        'Kedudukan kepala kelihatan menunduk terlalu rendah ke arah bawah berbanding paras bahu dalam gambar ini.';
      k1Suggestion =
        'Tegakkan kepala secara semula jadi selari dengan badan dan pandang ke hadapan, bukan menunduk melihat kaki.';
    } else if (excessiveBackwardLean) {
      k1Status = 'Perlu penambahbaikan';
      k1Observation = `Postur badan atas menunjukkan kecondongan besar (~${trunkLeanDeg}°) berbanding garis tegak pada detik ini.`;
      k1Suggestion =
        'Pastikan postur badan stabil dan seimbang; condong sedikit hanya semasa fasa permulaan pecutan.';
    }

    const k1Conf: ConfidenceCategory =
      (nose.visibility ?? 0.5) >= 0.65 && hasHips ? 'Tinggi' : 'Sederhana';

    criteria.push({
      code: 'K1',
      name: 'K1 — Kedudukan Kepala',
      observedRegion: 'Kepala, bahu dan penjajaran badan atas',
      visibleObservation: `${k1Observation} ${gazeNote}`,
      supportingEvidence:
        trunkLeanDeg !== null
          ? `Jarak menegak kepala-bahu nisbah ${(headLiftRatio * 100).toFixed(0)}%, anjakan mendatar ${(headForwardRatio * 100).toFixed(0)}%, sudut condong badan ~${trunkLeanDeg}°.`
          : `Jarak menegak kepala-bahu nisbah ${(headLiftRatio * 100).toFixed(0)}%.`,
      confidence: k1Conf,
      status: k1Status,
      improvementSuggestion: k1Suggestion,
    });
  }

  // -------------------------------------------------------------------------
  // K2 — PERGERAKAN TANGAN (single still frame — no fake swing-direction claim!)
  // -------------------------------------------------------------------------
  if (!hasLeftArm && !hasRightArm) {
    criteria.push({
      code: 'K2',
      name: 'K2 — Pergerakan Tangan',
      observedRegion: 'Bahu, siku dan pergelangan tangan',
      visibleObservation:
        'Lengan, siku atau pergelangan tangan tidak dapat dikesan dengan lengkap pada gambar ini.',
      supportingEvidence:
        'Sebahagian lengan terlindung oleh badan atau berada di luar keyakinan pengesanan.',
      confidence: 'Rendah',
      status: 'Tidak dapat dipastikan daripada gambar ini',
      improvementSuggestion:
        'Pilih detik lain di mana kedudukan siku dan pergelangan tangan kelihatan jelas tanpa terlindung.',
    });
  } else {
    const angles: Array<{ side: string; angle: number }> = [];
    if (hasLeftArm) {
      angles.push({
        side: 'kiri',
        angle: calcAngleDeg(lShoulder, lElbow, lWrist),
      });
    }
    if (hasRightArm) {
      angles.push({
        side: 'kanan',
        angle: calcAngleDeg(rShoulder, rElbow, rWrist),
      });
    }

    const straightArms = angles.filter((a) => a.angle > 142);
    const overTightArms = angles.filter((a) => a.angle < 45);

    // Check lateral wrist crossing relative to shoulder width (only meaningful if both shoulders visible)
    let crossingBody = false;
    if (hasShoulders) {
      const midShoulderX = (lShoulder.x + rShoulder.x) / 2;
      const shoulderSpan = Math.abs(lShoulder.x - rShoulder.x);
      // Only check crossing when camera sees torso width somewhat (not purely flat side profile)
      if (shoulderSpan > 0.045) {
        if (
          hasLeftArm &&
          Math.sign(lWrist.x - midShoulderX) !== Math.sign(lShoulder.x - midShoulderX) &&
          Math.abs(lWrist.x - midShoulderX) > shoulderSpan * 0.35
        ) {
          crossingBody = true;
        }
        if (
          hasRightArm &&
          Math.sign(rWrist.x - midShoulderX) !== Math.sign(rShoulder.x - midShoulderX) &&
          Math.abs(rWrist.x - midShoulderX) > shoulderSpan * 0.35
        ) {
          crossingBody = true;
        }
      }
    }

    let k2Status: TechniqueStatus = 'Memenuhi kriteria berdasarkan gambar';
    let k2Obs = `Kedudukan lengan dan siku yang kelihatan (${angles
      .map((a) => `siku ${a.side} ${a.angle}°`)
      .join(', ')}) dibengkokkan secara semula jadi berhampiran badan.`;
    let k2Suggestion =
      'Kekalkan siku bengkok secara semula jadi dan hayun dari bahu secara berselang-seli. Semak satu detik lain untuk mengesahkan ayunan berterusan.';

    if (straightArms.length > 0) {
      k2Status = 'Perlu penambahbaikan';
      k2Obs = `Siku ${straightArms
        .map((a) => `${a.side} (${a.angle}°)`)
        .join(' dan ')} kelihatan agak lurus pada detik ini.`;
      k2Suggestion =
        'Bengkokkan siku secara semula jadi (sekitar 70°–110°) dan elakkan meluruskan lengan semasa memecut.';
    } else if (overTightArms.length > 0) {
      k2Status = 'Perlu penambahbaikan';
      k2Obs = `Sudut siku (${overTightArms
        .map((a) => `${a.side} ${a.angle}°`)
        .join(', ')}) kelihatan terlalu sempit dan tegang pada gambar ini.`;
      k2Suggestion =
        'Rehatkan bahu dan buka sedikit sudut siku kepada sudut bengkok yang selesa.';
    } else if (crossingBody) {
      k2Status = 'Perlu penambahbaikan';
      k2Obs =
        'Pergelangan tangan kelihatan melintang melepasi garisan tengah dada dalam gambar ini.';
      k2Suggestion =
        'Hayunkan tangan ke hadapan dan ke belakang selari dengan sisi badan, elakkan tangan menyilang di hadapan dada.';
    }

    criteria.push({
      code: 'K2',
      name: 'K2 — Pergerakan Tangan',
      observedRegion: 'Bahu, siku dan pergelangan tangan berbanding badan',
      visibleObservation: `${k2Obs} Nota: arah dan corak ayunan berselang-seli tidak boleh disahkan daripada satu gambar pegun sahaja.`,
      supportingEvidence: `Sudut siku dikesan: ${angles
        .map((a) => `${a.side} ${a.angle}°`)
        .join(', ')}.`,
      confidence: hasLeftArm && hasRightArm ? 'Tinggi' : 'Sederhana',
      status: k2Status,
      improvementSuggestion: k2Suggestion,
    });
  }

  // -------------------------------------------------------------------------
  // K3 — PERGERAKAN KAKI
  // -------------------------------------------------------------------------
  if (!hasHips || (!hasLeftLeg && !hasRightLeg)) {
    criteria.push({
      code: 'K3',
      name: 'K3 — Pergerakan Kaki',
      observedRegion: 'Pinggul, lutut dan buku lali',
      visibleObservation:
        'Bahagian pinggul, lutut atau buku lali tidak dapat dikesan dengan jelas pada gambar ini.',
      supportingEvidence:
        'Kaki atau lutut tidak cukup jelas atau terkeluar daripada sempadan gambar.',
      confidence: 'Rendah',
      status: 'Tidak dapat dipastikan daripada gambar ini',
      improvementSuggestion:
        'Pilih detik lain di mana keseluruhan pinggul, lutut dan buku lali kelihatan jelas di dalam gambar.',
    });
  } else {
    const midHipY = (lHip.y + rHip.y) / 2;
    const legMeasurements: string[] = [];

    const lKneeFlexion = hasLeftLeg ? calcAngleDeg(lHip, lKnee, lAnkle) : null;
    const rKneeFlexion = hasRightLeg ? calcAngleDeg(rHip, rKnee, rAnkle) : null;

    const lThighLen = hasLeftLeg ? Math.max(0.05, dist(lHip, lKnee)) : 0.2;
    const rThighLen = hasRightLeg ? Math.max(0.05, dist(rHip, rKnee)) : 0.2;
    const avgThighLen = (lThighLen + rThighLen) / 2;

    const minKneeY = Math.min(
      hasLeftLeg ? lKnee.y : 1,
      hasRightLeg ? rKnee.y : 1
    );
    const kneeLiftRatio = (midHipY - minKneeY) / avgThighLen; // > -0.35 indicates active forward/upward lift in sprint
    const ankleSeparation =
      hasLeftLeg && hasRightLeg ? Math.abs(lAnkle.x - rAnkle.x) / avgThighLen : 0;

    if (lKneeFlexion !== null) legMeasurements.push(`lutut kiri ${lKneeFlexion}°`);
    if (rKneeFlexion !== null) legMeasurements.push(`lutut kanan ${rKneeFlexion}°`);

    const hasActiveKneeLiftOrStride =
      kneeLiftRatio > -0.45 ||
      ankleSeparation > 0.65 ||
      (lKneeFlexion !== null && lKneeFlexion < 135) ||
      (rKneeFlexion !== null && rKneeFlexion < 135);

    let k3Status: TechniqueStatus = 'Memenuhi kriteria berdasarkan gambar';
    let k3Obs = '';
    let k3Suggestion =
      'Teruskan mengangkat lutut secara aktif ke hadapan mengikut ritma ayunan tangan.';

    if (hasActiveKneeLiftOrStride) {
      k3Obs =
        kneeLiftRatio > -0.15
          ? 'Lutut hadapan kelihatan diangkat aktif menghampiri atau melepasi paras pinggul dengan pemisahan langkah yang baik.'
          : 'Kedudukan pinggul, lutut dan buku lali menunjukkan pembengkokan dan pemisahan langkah larian pada detik ini.';
    } else {
      k3Status = 'Perlu penambahbaikan';
      k3Obs =
        'Kedudukan kedua-dua lutut kelihatan rendah dan kurang pemisahan langkah pada detik gambar ini.';
      k3Suggestion =
        'Angkat lutut dengan lebih aktif ke hadapan semasa fasa larian pecut. Jika detik ini ialah fasa berdiri/permulaan, pilih detik lain di pertengahan larian.';
    }

    criteria.push({
      code: 'K3',
      name: 'K3 — Pergerakan Kaki',
      observedRegion: 'Pinggul, lutut dan buku lali',
      visibleObservation: k3Obs,
      supportingEvidence: `${legMeasurements.join(', ')}${
        hasLeftLeg && hasRightLeg
          ? `; jarak mendatar antara buku lali nisbah ${(ankleSeparation * 100).toFixed(0)}% panjang paha.`
          : '.'
      }`,
      confidence: hasLeftLeg && hasRightLeg ? 'Tinggi' : 'Sederhana',
      status: k3Status,
      improvementSuggestion: k3Suggestion,
    });
  }

  // -------------------------------------------------------------------------
  // K4 — SENTUHAN DAN TOLAKAN KAKI
  // -------------------------------------------------------------------------
  if (!hasLeftFoot && !hasRightFoot) {
    criteria.push({
      code: 'K4',
      name: 'K4 — Sentuhan dan Tolakan Kaki',
      observedRegion: 'Buku lali, tumit, hujung tapak kaki (kasut) dan permukaan trek',
      visibleObservation:
        'Bahagian kaki, tumit dan hujung kasut tidak dapat dikesan daripada gambar ini.',
      supportingEvidence:
        'Landmark buku lali, tumit atau hujung kaki tiada dalam bingkai atau terpotong di bahagian bawah gambar.',
      confidence: 'Rendah',
      status: 'Tidak dapat dipastikan daripada gambar ini',
      improvementSuggestion:
        'Pilih detik lain di mana kedua-dua kasut dan kawasan permukaan trek kelihatan penuh tanpa terpotong di bawah.',
    });
  } else {
    // Identify lower foot (largest y = closest to ground)
    const candidates: Array<{
      side: string;
      ankle: NormalizedLandmark;
      heel: NormalizedLandmark | null;
      toe: NormalizedLandmark | null;
      lowestY: number;
    }> = [];

    if (hasLeftFoot) {
      const heel = isLandmarkUsable(lHeel, 0.35, 0.988) ? lHeel : null;
      const toe = isLandmarkUsable(lToe, 0.35, 0.988) ? lToe : null;
      const lowestY = Math.max(lAnkle.y, heel?.y ?? 0, toe?.y ?? 0);
      candidates.push({ side: 'kiri', ankle: lAnkle, heel, toe, lowestY });
    }
    if (hasRightFoot) {
      const heel = isLandmarkUsable(rHeel, 0.35, 0.988) ? rHeel : null;
      const toe = isLandmarkUsable(rToe, 0.35, 0.988) ? rToe : null;
      const lowestY = Math.max(rAnkle.y, heel?.y ?? 0, toe?.y ?? 0);
      candidates.push({ side: 'kanan', ankle: rAnkle, heel, toe, lowestY });
    }

    candidates.sort((a, b) => b.lowestY - a.lowestY);
    const lowerFoot = candidates[0];

    if (!lowerFoot.heel || !lowerFoot.toe) {
      criteria.push({
        code: 'K4',
        name: 'K4 — Sentuhan dan Tolakan Kaki',
        observedRegion: 'Buku lali, tumit dan hujung tapak kaki (kasut)',
        visibleObservation: `Sebahagian landmark kaki bawah (${lowerFoot.side}) tidak lengkap untuk menentu sahkan orientasi tumit dan hujung tapak kaki.`,
        supportingEvidence:
          'Tumit atau hujung tapak kaki tidak cukup jelas pada gambar pegun ini.',
        confidence: 'Rendah',
        status: 'Tidak dapat dipastikan daripada gambar ini',
        improvementSuggestion:
          'Pilih detik lain apabila kaki yang mencecah trek kelihatan jelas dari sisi bersama kawasan tanah.',
      });
    } else {
      // Compare heel.y vs toe.y (larger y = lower on screen / closer to ground)
      const heelVsToeDelta = lowerFoot.toe.y - lowerFoot.heel.y; // > 0 means toe/forefoot is lower than heel (forefoot alignment)
      const heelNoticeablyLower = heelVsToeDelta < -0.018;

      if (heelNoticeablyLower) {
        criteria.push({
          code: 'K4',
          name: 'K4 — Sentuhan dan Tolakan Kaki',
          observedRegion: `Kaki bawah (${lowerFoot.side}): buku lali, tumit dan hujung kasut`,
          visibleObservation: `Pada kaki ${lowerFoot.side} yang paling hampir dengan permukaan, bahagian tumit kelihatan lebih rendah berbanding hujung tapak kaki. Tolakan sebenar tidak dapat dipastikan daripada satu gambar pegun sahaja.`,
          supportingEvidence: `Kedudukan tumit lebih rendah daripada hujung kaki pada kaki ${lowerFoot.side} pada detik ini.`,
          confidence: 'Sederhana',
          status: 'Perlu penambahbaikan',
          improvementSuggestion:
            'Elakkan mendarat dengan tumit dahulu; sasarkan sentuhan bahagian hadapan tapak kaki (bebola kaki) yang kemas sebelum menolak ke hadapan.',
        });
      } else {
        criteria.push({
          code: 'K4',
          name: 'K4 — Sentuhan dan Tolakan Kaki',
          observedRegion: `Kaki bawah (${lowerFoot.side}): buku lali, tumit dan hujung kasut`,
          visibleObservation: `Kedudukan kasut kaki ${lowerFoot.side} menunjukkan bahagian hadapan tapak kaki menghala ke permukaan trek dengan tumit sedikit terangkat. Nota: daya tolakan sebenar hanya dapat disahkan melalui jujukan pergerakan video.`,
          supportingEvidence: `Landmark buku lali, tumit dan hujung kaki ${lowerFoot.side} dikesan dengan orientasi tapak hadapan menghampiri permukaan.`,
          confidence: 'Sederhana',
          status: 'Memenuhi kriteria berdasarkan gambar',
          improvementSuggestion:
            'Teruskan mengekalkan sentuhan bahagian hadapan tapak kaki secara lancar dan elakkan berlari kaku di atas hujung jari kaki. Pilih satu detik lain jika ingin menyemak kaki sebelah lagi.',
        });
      }
    }
  }

  const metCount = criteria.filter(
    (c) => c.status === 'Memenuhi kriteria berdasarkan gambar'
  ).length;
  const improveList = criteria.filter((c) => c.status === 'Perlu penambahbaikan');
  const uncertainList = criteria.filter(
    (c) => c.status === 'Tidak dapat dipastikan daripada gambar ini'
  );

  let overallSummaryAya = `${metCount}/4 kriteria memenuhi ciri berdasarkan gambar pilihan ini.`;
  if (improveList.length > 0) {
    overallSummaryAya += ` Aspek yang perlu penambahbaikan: ${improveList
      .map((c) => c.code)
      .join(', ')}.`;
  }
  if (uncertainList.length > 0) {
    overallSummaryAya += ` Kriteria ${uncertainList
      .map((c) => c.code)
      .join(', ')} tidak dapat dipastikan daripada gambar ini.`;
  }

  let overallSummaryArif = '';
  if (missingBodyParts.length > 0) {
    overallSummaryArif = `Sesetengah bahagian (${missingBodyParts.join(
      ', '
    )}) tidak dikesan dengan jelas pada detik ini. Kamu boleh pilih detik lain pada video untuk menyemak bahagian tersebut!`;
  } else if (improveList.length > 0) {
    overallSummaryArif = `Bagus, Ejen Pecut! Seluruh badan berjaya dikesan. Mari fokuskan pembetulan pada ${improveList
      .map((c) => c.code)
      .join(', ')} dan cuba juga semak detik lain jika perlu.`;
  } else {
    overallSummaryArif =
      'Hebat! Seluruh badan dari kepala hingga kasut berjaya dikesan dan kesemua kriteria kelihatan baik pada detik gambar pilihan ini.';
  }

  const priorityFocus =
    improveList.length > 0
      ? `${improveList[0].name}`
      : uncertainList.length > 0
        ? `Pilih detik lain yang lebih jelas untuk ${uncertainList
            .map((c) => c.code)
            .join(', ')}`
        : 'Kekalkan teknik larian pecut yang konsisten pada detik lain juga';

  const o3CheckPrompt =
    improveList.length > 0
      ? `Apakah pembetulan yang ingin kamu lakukan bagi ${improveList
          .map((c) => c.code)
          .join(' dan ')} pada larian seterusnya?`
      : 'Berdasarkan gambar detik pilihan ini, apakah satu kekuatan teknik kamu atau aspek lain yang ingin disemak?';

  return {
    poseDetected: true,
    detectedBodyParts,
    missingBodyParts,
    criteria,
    overallSummaryAya,
    overallSummaryArif,
    priorityFocus,
    o3CheckPrompt,
  };
}

export async function analyzeSelectedFrame(
  frame: ExtractedFrame
): Promise<FrameAnalysisResult> {
  const landmarker = await getSingleFrameLandmarker();
  let landmarks: NormalizedLandmark[] | null = null;

  if (landmarker) {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error('Gagal memuatkan gambar bingkai terpilih.'));
      el.src = frame.dataUrl;
    });

    try {
      const detection = landmarker.detect(img);
      if (detection.landmarks && detection.landmarks.length > 0) {
        landmarks = detection.landmarks[0].map((pt) => ({
          x: pt.x,
          y: pt.y,
          z: pt.z,
          visibility: pt.visibility,
        }));
      }
    } catch {
      landmarks = null;
    }
  }

  const evaluated = assessCriteriaFromLandmarks(landmarks);

  return {
    id: `frame_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    timestampSec: frame.timestampSec,
    imageWidth: frame.width,
    imageHeight: frame.height,
    frameDataUrl: frame.dataUrl,
    landmarks,
    poseDetected: evaluated.poseDetected,
    detectedBodyParts: evaluated.detectedBodyParts,
    missingBodyParts: evaluated.missingBodyParts,
    overallSummaryArif: evaluated.overallSummaryArif,
    overallSummaryAya: evaluated.overallSummaryAya,
    criteria: evaluated.criteria,
    priorityFocus: evaluated.priorityFocus,
    o3CheckPrompt: evaluated.o3CheckPrompt,
    analyzedAt: new Date().toISOString(),
    engineNote: evaluated.poseDetected
      ? `Analisis Bingkai Tunggal pada ${frame.timestampSec.toFixed(
          2
        )}s (${frame.width}×${frame.height}) menggunakan MediaPipe Pose tempatan tanpa pelayan luar.`
      : `Analisis Bingkai Tunggal pada ${frame.timestampSec.toFixed(
          2
        )}s: pengesanan pose tidak dapat mengesan badan dengan keyakinan mencukupi.`,
  };
}
