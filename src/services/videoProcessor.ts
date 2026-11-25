import { FilesetResolver, PoseLandmarker } from '@mediapipe/tasks-vision';
import {
  NormalizedLandmark,
  PoseTelemetrySummary,
  QualityCheckMetric,
  SampledPoseKeyframe,
  VideoQualityReport,
  VideoSuitability,
} from '../types/arena';

let cachedPoseLandmarker: PoseLandmarker | null = null;
let poseInitPromise: Promise<PoseLandmarker | null> | null = null;

async function getPoseLandmarker(): Promise<PoseLandmarker | null> {
  if (cachedPoseLandmarker) return cachedPoseLandmarker;
  if (poseInitPromise) return poseInitPromise;

  poseInitPromise = (async () => {
    try {
      const vision = await FilesetResolver.forVisionTasks('/mediapipe-wasm');
      const modelUrl = '/mediapipe-models/pose_landmarker_lite.task';
      const landmarker = await Promise.race([
        PoseLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: modelUrl,
            delegate: 'CPU',
          },
          runningMode: 'IMAGE',
          numPoses: 1,
          minPoseDetectionConfidence: 0.35,
          minPosePresenceConfidence: 0.35,
          minTrackingConfidence: 0.35,
        }),
        new Promise<null>((resolve) => setTimeout(() => resolve(null), 10000)),
      ]);
      if (landmarker) {
        cachedPoseLandmarker = landmarker;
      }
      return landmarker;
    } catch {
      return null;
    }
  })();

  return poseInitPromise;
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
  return (Math.acos(cosVal) * 180) / Math.PI;
}

function measureFrameMetrics(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  prevGray: Float32Array | null
): {
  brightness: number;
  blurVariance: number;
  stability: number;
  motionDelta: number;
  gray: Float32Array;
} {
  const imgData = ctx.getImageData(0, 0, w, h).data;
  const count = w * h;
  const gray = new Float32Array(count);
  let sumLum = 0;

  for (let i = 0, p = 0; i < imgData.length; i += 4, p++) {
    const lum = 0.299 * imgData[i] + 0.587 * imgData[i + 1] + 0.114 * imgData[i + 2];
    gray[p] = lum;
    sumLum += lum;
  }
  const brightness = sumLum / Math.max(1, count);

  // Discrete Laplacian variance for blur/sharpness estimation
  let lapSum = 0;
  let lapSqSum = 0;
  let lapCount = 0;
  for (let y = 1; y < h - 1; y += 2) {
    for (let x = 1; x < w - 1; x += 2) {
      const idx = y * w + x;
      const lap =
        gray[idx - w] +
        gray[idx + w] +
        gray[idx - 1] +
        gray[idx + 1] -
        4 * gray[idx];
      lapSum += lap;
      lapSqSum += lap * lap;
      lapCount++;
    }
  }
  const lapMean = lapSum / Math.max(1, lapCount);
  const blurVariance = lapSqSum / Math.max(1, lapCount) - lapMean * lapMean;

  // Frame-to-frame border stability check & center runner motion check
  let stability = 0.9;
  let motionDelta = 0;
  if (prevGray && prevGray.length === gray.length) {
    let borderDiffSum = 0;
    let borderPixels = 0;
    const topBand = Math.floor(h * 0.16);
    for (let y = 0; y < topBand; y++) {
      for (let x = 0; x < w; x += 2) {
        const idx = y * w + x;
        borderDiffSum += Math.abs(gray[idx] - prevGray[idx]);
        borderPixels++;
      }
    }
    const meanBorderDiff = borderDiffSum / Math.max(1, borderPixels);
    stability = Math.max(0, Math.min(1, 1 - meanBorderDiff / 45));

    let centerDiffSum = 0;
    let centerPixels = 0;
    const yStart = Math.floor(h * 0.2);
    const yEnd = Math.floor(h * 0.9);
    for (let y = yStart; y < yEnd; y += 2) {
      for (let x = 0; x < w; x += 2) {
        const idx = y * w + x;
        centerDiffSum += Math.abs(gray[idx] - prevGray[idx]);
        centerPixels++;
      }
    }
    motionDelta = centerDiffSum / Math.max(1, centerPixels);
  }

  return { brightness, blurVariance, stability, motionDelta, gray };
}

function seekVideoTo(video: HTMLVideoElement, timeSec: number): Promise<void> {
  return new Promise((resolve) => {
    const onSeeked = () => {
      cleanup();
      resolve();
    };
    const onError = () => {
      cleanup();
      resolve();
    };
    const timer = window.setTimeout(() => {
      cleanup();
      resolve();
    }, 1500);
    const cleanup = () => {
      window.clearTimeout(timer);
      video.removeEventListener('seeked', onSeeked);
      video.removeEventListener('error', onError);
    };
    video.addEventListener('seeked', onSeeked, { once: true });
    video.addEventListener('error', onError, { once: true });
    video.currentTime = Math.max(0, Math.min(video.duration || 0, timeSec));
  });
}

async function estimateVideoFps(video: HTMLVideoElement): Promise<number> {
  const vidAny = video as HTMLVideoElement & {
    requestVideoFrameCallback?: (cb: (now: number, meta: { mediaTime: number }) => void) => number;
  };
  if (typeof vidAny.requestVideoFrameCallback === 'function' && video.duration > 0.6) {
    return new Promise((resolve) => {
      const timestamps: number[] = [];
      let done = false;
      const origMuted = video.muted;
      video.muted = true;
      video.currentTime = Math.min(0.1, video.duration * 0.05);

      const finish = () => {
        if (done) return;
        done = true;
        try {
          video.pause();
        } catch {
          // ignore
        }
        video.muted = origMuted;
        if (timestamps.length >= 3) {
          const deltas: number[] = [];
          for (let i = 1; i < timestamps.length; i++) {
            const d = timestamps[i] - timestamps[i - 1];
            if (d > 0.004 && d < 0.25) deltas.push(d);
          }
          if (deltas.length > 0) {
            const avgDelta = deltas.reduce((a, b) => a + b, 0) / deltas.length;
            resolve(Math.round(Math.min(120, Math.max(5, 1 / avgDelta))));
            return;
          }
        }
        resolve(30);
      };

      const step = (_now: number, meta: { mediaTime: number }) => {
        if (done) return;
        timestamps.push(meta.mediaTime);
        if (timestamps.length >= 8) {
          finish();
        } else {
          vidAny.requestVideoFrameCallback?.(step);
        }
      };

      window.setTimeout(finish, 450);
      vidAny.requestVideoFrameCallback?.(step);
      video.play().catch(() => finish());
    });
  }
  return 30;
}

export interface ProcessedSprintVideo {
  qualityReport: VideoQualityReport;
  poseTelemetry: PoseTelemetrySummary;
  keyframes: Array<{ timestampSec: number; dataUrl: string; phaseLabel: string }>;
}

export async function processSprintVideo(
  file: File,
  onProgress?: (stage: string, percent: number) => void
): Promise<ProcessedSprintVideo> {
  onProgress?.('Memeriksa kebolehbacaan dan resolusi video...', 10);

  const objectUrl = URL.createObjectURL(file);
  const video = document.createElement('video');
  video.preload = 'auto';
  video.muted = true;
  video.playsInline = true;
  video.src = objectUrl;

  try {
    await new Promise<void>((resolve, reject) => {
      const timer = window.setTimeout(
        () => reject(new Error('Fail video tidak dapat dimuatkan dalam masa yang ditetapkan.')),
        10000
      );
      video.onloadedmetadata = () => {
        window.clearTimeout(timer);
        resolve();
      };
      video.onerror = () => {
        window.clearTimeout(timer);
        reject(new Error('Fail video rosak atau formatnya tidak disokong oleh pelayar.'));
      };
    });

    const durationSec = Number.isFinite(video.duration) ? video.duration : 0;
    const width = video.videoWidth || 0;
    const height = video.videoHeight || 0;

    if (width === 0 || height === 0 || durationSec <= 0.1) {
      throw new Error('Video tidak mempunyai aliran gambar yang sah.');
    }

    onProgress?.('Mengukur kadar bingkai sebenar video...', 20);
    const estimatedFps = await estimateVideoFps(video);

    onProgress?.('Menyediakan enjin pengesanan postur MediaPipe...', 30);
    const landmarker = await getPoseLandmarker();

    // Sample up to 32 sequential frames across the active sprint window (max 8s window)
    const analysisStart = durationSec > 1.2 ? Math.min(0.15, durationSec * 0.05) : 0;
    const analysisEnd = Math.min(durationSec - 0.05, analysisStart + 8);
    const span = Math.max(0.4, analysisEnd - analysisStart);
    const sampleCount = Math.min(32, Math.max(12, Math.round(span * 10)));

    // Small analysis canvas for brightness/blur/stability + larger canvas for pose & keyframes
    const metricW = 160;
    const metricH = Math.max(90, Math.round((metricW * height) / width));
    const metricCanvas = document.createElement('canvas');
    metricCanvas.width = metricW;
    metricCanvas.height = metricH;
    const metricCtx = metricCanvas.getContext('2d', { willReadFrequently: true })!;

    const poseW = Math.min(640, width);
    const poseH = Math.round((poseW * height) / width);
    const poseCanvas = document.createElement('canvas');
    poseCanvas.width = poseW;
    poseCanvas.height = poseH;
    const poseCtx = poseCanvas.getContext('2d')!;

    let prevGray: Float32Array | null = null;
    let sumBrightness = 0;
    let sumBlur = 0;
    let sumStability = 0;
    let sumMotion = 0;
    let stabilitySamples = 0;

    let detectedPoseFrames = 0;
    let fullBodyFrames = 0;
    const trunkLeans: number[] = [];
    const elbowAngles: number[] = [];
    const wristDiffs: number[] = [];
    const lateralDrifts: number[] = [];
    const kneeLifts: number[] = [];
    const ankleDiffs: number[] = [];
    let feetVisibleFrames = 0;
    let headVisibleFrames = 0;

    const keyframeIndices = new Set<number>([
      0,
      Math.floor(sampleCount * 0.2),
      Math.floor(sampleCount * 0.4),
      Math.floor(sampleCount * 0.6),
      Math.floor(sampleCount * 0.8),
      sampleCount - 1,
    ]);
    const keyframes: SampledPoseKeyframe[] = [];

    for (let i = 0; i < sampleCount; i++) {
      const t = analysisStart + (span * i) / Math.max(1, sampleCount - 1);
      await seekVideoTo(video, t);

      metricCtx.drawImage(video, 0, 0, metricW, metricH);
      const m = measureFrameMetrics(metricCtx, metricW, metricH, prevGray);
      prevGray = m.gray;
      sumBrightness += m.brightness;
      sumBlur += m.blurVariance;
      if (i > 0) {
        sumStability += m.stability;
        sumMotion += m.motionDelta;
        stabilitySamples++;
      }

      poseCtx.drawImage(video, 0, 0, poseW, poseH);

      let frameLandmarks: NormalizedLandmark[] | null = null;
      if (landmarker) {
        try {
          const result = landmarker.detect(poseCanvas);
          if (result.landmarks && result.landmarks.length > 0) {
            const lm = result.landmarks[0].map((pt) => ({
              x: pt.x,
              y: pt.y,
              z: pt.z,
              visibility: pt.visibility,
            }));
            frameLandmarks = lm;
            detectedPoseFrames++;

            const nose = lm[0];
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

            if ((nose.visibility ?? 1) > 0.4) headVisibleFrames++;
            if (
              (nose.visibility ?? 1) > 0.35 &&
              (lHip.visibility ?? 1) > 0.35 &&
              ((lAnkle.visibility ?? 0) > 0.3 || (rAnkle.visibility ?? 0) > 0.3)
            ) {
              fullBodyFrames++;
            }
            if ((lAnkle.visibility ?? 0) > 0.35 || (rAnkle.visibility ?? 0) > 0.35) {
              feetVisibleFrames++;
            }

            // Trunk forward lean angle relative to vertical
            const midShoulderX = (lShoulder.x + rShoulder.x) / 2;
            const midShoulderY = (lShoulder.y + rShoulder.y) / 2;
            const midHipX = (lHip.x + rHip.x) / 2;
            const midHipY = (lHip.y + rHip.y) / 2;
            const dx = Math.abs(midShoulderX - midHipX);
            const dy = Math.max(0.01, midHipY - midShoulderY);
            trunkLeans.push(Math.round((Math.atan2(dx, dy) * 180) / Math.PI));

            // Elbow angles
            if ((lElbow.visibility ?? 0) > 0.3 && (lWrist.visibility ?? 0) > 0.3) {
              elbowAngles.push(Math.round(calcAngleDeg(lShoulder, lElbow, lWrist)));
            }
            if ((rElbow.visibility ?? 0) > 0.3 && (rWrist.visibility ?? 0) > 0.3) {
              elbowAngles.push(Math.round(calcAngleDeg(rShoulder, rElbow, rWrist)));
            }

            // Arm alternation & lateral drift
            wristDiffs.push(lWrist.x - rWrist.x);
            const shoulderWidth = Math.max(0.05, Math.abs(lShoulder.x - rShoulder.x));
            lateralDrifts.push(
              Math.abs(lWrist.x - midShoulderX) / shoulderWidth +
                Math.abs(rWrist.x - midShoulderX) / shoulderWidth
            );

            // Knee elevation relative to hip (higher knee = smaller y relative to hip)
            const minKneeY = Math.min(lKnee.y, rKnee.y);
            kneeLifts.push(midHipY - minKneeY);
            ankleDiffs.push(lAnkle.x - rAnkle.x);
          }
        } catch {
          // Skip frame pose detection error gracefully
        }
      }

      if (keyframeIndices.has(i)) {
        const phaseRatio = i / Math.max(1, sampleCount - 1);
        const phaseLabel =
          phaseRatio < 0.25
            ? 'Permulaan'
            : phaseRatio < 0.65
              ? 'Pecutan'
              : 'Larian Penuh';
        keyframes.push({
          timestampSec: Number(t.toFixed(2)),
          dataUrl: poseCanvas.toDataURL('image/jpeg', 0.78),
          landmarks: frameLandmarks,
          phaseLabel,
        });
      }

      const pct = 32 + Math.round(((i + 1) / sampleCount) * 58);
      onProgress?.(`Menganalisis bingkai ${i + 1}/${sampleCount}...`, pct);
    }

    const avgBrightness = Math.round(sumBrightness / sampleCount);
    const avgBlur = Math.round(sumBlur / sampleCount);
    const avgStability = stabilitySamples > 0 ? sumStability / stabilitySamples : 0.85;
    const avgMotionDelta = stabilitySamples > 0 ? sumMotion / stabilitySamples : 0;
    const motionScore = Number(Math.min(1, avgMotionDelta / 12).toFixed(2));
    const personVisibleRatio =
      landmarker && sampleCount > 0 ? detectedPoseFrames / sampleCount : 0.5;

    const warnings: string[] = [];
    const metrics: QualityCheckMetric[] = [];

    // 1. Duration check
    if (durationSec < 1.2) {
      warnings.push('Tempoh video terlalu pendek (< 1.2 saat). Rakam urutan larian pecut yang lebih lengkap.');
      metrics.push({
        key: 'duration',
        label: 'Tempoh Rakaman',
        status: 'gagal',
        detail: `${durationSec.toFixed(1)}s (Terlalu pendek)`,
      });
    } else if (durationSec > 35) {
      warnings.push('Video agak panjang (> 35 saat). Disyorkan klip pendek yang fokus pada larian 30 meter.');
      metrics.push({
        key: 'duration',
        label: 'Tempoh Rakaman',
        status: 'amaran',
        detail: `${durationSec.toFixed(1)}s (Panjang)`,
      });
    } else {
      metrics.push({
        key: 'duration',
        label: 'Tempoh Rakaman',
        status: 'lulus',
        detail: `${durationSec.toFixed(1)}s`,
      });
    }

    // 2. Resolution check
    if (width < 420 || height < 320) {
      warnings.push('Resolusi video rendah. Pelari mungkin kelihatan terlalu jauh atau kurang jelas.');
      metrics.push({
        key: 'resolution',
        label: 'Resolusi',
        status: 'amaran',
        detail: `${width}×${height}`,
      });
    } else {
      metrics.push({
        key: 'resolution',
        label: 'Resolusi',
        status: 'lulus',
        detail: `${width}×${height}`,
      });
    }

    // 3. FPS check
    if (estimatedFps < 20) {
      warnings.push(`Kadar bingkai rendah (~${estimatedFps} FPS). Pergerakan pantas sukar diperhatikan untuk K4.`);
      metrics.push({
        key: 'fps',
        label: 'Kadar Bingkai',
        status: 'amaran',
        detail: `~${estimatedFps} FPS`,
      });
    } else {
      metrics.push({
        key: 'fps',
        label: 'Kadar Bingkai',
        status: 'lulus',
        detail: `~${estimatedFps} FPS`,
      });
    }

    // 4. Lighting check
    if (avgBrightness < 42) {
      warnings.push('Rakaman terlalu gelap. Sila rakam di kawasan yang mempunyai pencahayaan mencukupi.');
      metrics.push({
        key: 'lighting',
        label: 'Pencahayaan',
        status: 'gagal',
        detail: 'Terlalu gelap',
      });
    } else if (avgBrightness > 235) {
      warnings.push('Pencahayaan terlalu silau sehingga butiran badan sukar dilihat.');
      metrics.push({
        key: 'lighting',
        label: 'Pencahayaan',
        status: 'amaran',
        detail: 'Terlalu terang / silau',
      });
    } else {
      metrics.push({
        key: 'lighting',
        label: 'Pencahayaan',
        status: 'lulus',
        detail: 'Mencukupi',
      });
    }

    // 5. Sharpness / blur check
    if (avgBlur < 45) {
      warnings.push('Video kelihatan kabur. Fokuskan kamera dengan jelas sebelum merakam.');
      metrics.push({
        key: 'blur',
        label: 'Kejelasan',
        status: 'amaran',
        detail: 'Agak kabur',
      });
    } else {
      metrics.push({
        key: 'blur',
        label: 'Kejelasan',
        status: 'lulus',
        detail: 'Jelas',
      });
    }

    // 6. Camera stability check
    if (avgStability < 0.55) {
      warnings.push('Kamera bergoyang atau tidak stabil semasa rakaman.');
      metrics.push({
        key: 'stability',
        label: 'Kestabilan Kamera',
        status: 'amaran',
        detail: 'Bergoyang',
      });
    } else {
      metrics.push({
        key: 'stability',
        label: 'Kestabilan Kamera',
        status: 'lulus',
        detail: 'Stabil',
      });
    }

    // 7. Body visibility & movement check
    if (motionScore < 0.08) {
      warnings.push('Pergerakan larian tidak ketara antara bingkai. Pastikan rakaman memaparkan aksi larian sebenar.');
    }

    if (landmarker) {
      if (detectedPoseFrames < Math.max(3, Math.floor(sampleCount * 0.25))) {
        warnings.push('Murid tidak kelihatan jelas di dalam bingkai atau terhalang sepanjang larian.');
        metrics.push({
          key: 'visibility',
          label: 'Keterlihatan Badan',
          status: 'gagal',
          detail: `${detectedPoseFrames}/${sampleCount} bingkai`,
        });
      } else if (fullBodyFrames < Math.floor(detectedPoseFrames * 0.5)) {
        warnings.push('Sebahagian anggota badan (seperti kaki) terkeluar daripada bingkai kamera.');
        metrics.push({
          key: 'visibility',
          label: 'Keterlihatan Badan',
          status: 'amaran',
          detail: 'Separa penuh',
        });
      } else {
        metrics.push({
          key: 'visibility',
          label: 'Keterlihatan Badan',
          status: 'lulus',
          detail: `${detectedPoseFrames}/${sampleCount} bingkai`,
        });
      }
    } else {
      metrics.push({
        key: 'visibility',
        label: 'Pengesan Postur',
        status: 'amaran',
        detail: 'Mod Bingkai Berurutan',
      });
    }

    const failedCriticalCount = metrics.filter((m) => m.status === 'gagal').length;
    let suitability: VideoSuitability = 'SESUAI';
    if (failedCriticalCount >= 1 || (landmarker && detectedPoseFrames < 3)) {
      suitability = 'TIDAK_SESUAI';
    } else if (warnings.length >= 2) {
      suitability = 'SEPARUH_SESUAI';
    }

    const qualityReport: VideoQualityReport = {
      readable: true,
      durationSec: Number(durationSec.toFixed(2)),
      width,
      height,
      estimatedFps,
      brightnessScore: avgBrightness,
      blurScore: avgBlur,
      stabilityScore: Number(avgStability.toFixed(2)),
      motionScore,
      personVisibleRatio: Number(personVisibleRatio.toFixed(2)),
      poseSuccessFrames: detectedPoseFrames,
      totalSampledFrames: sampleCount,
      suitability,
      warnings,
      metrics,
    };

    const armSignChanges = wristDiffs.reduce((acc, val, idx) => {
      if (idx === 0) return 0;
      return val * wristDiffs[idx - 1] < 0 ? acc + 1 : acc;
    }, 0);
    const ankleSignChanges = ankleDiffs.reduce((acc, val, idx) => {
      if (idx === 0) return 0;
      return val * ankleDiffs[idx - 1] < 0 ? acc + 1 : acc;
    }, 0);

    const avgLateral =
      lateralDrifts.length > 0
        ? lateralDrifts.reduce((a, b) => a + b, 0) / lateralDrifts.length
        : null;
    const maxKneeLift = kneeLifts.length > 0 ? Math.max(...kneeLifts) : null;

    const poseTelemetry: PoseTelemetrySummary = {
      poseEngineStatus:
        landmarker && detectedPoseFrames > 0
          ? 'mediapipe-active'
          : 'cv-fallback-no-landmarks',
      sampledFramesCount: sampleCount,
      detectedPoseFramesCount: detectedPoseFrames,
      headStabilityNotes:
        headVisibleFrames >= Math.max(3, detectedPoseFrames * 0.6)
          ? `Kepala dan bahu dikesan dalam ${headVisibleFrames} daripada ${detectedPoseFrames} bingkai.`
          : 'Kedudukan kepala kurang jelas dalam beberapa bingkai.',
      trunkLeanRangeDeg:
        trunkLeans.length > 0
          ? { min: Math.min(...trunkLeans), max: Math.max(...trunkLeans) }
          : null,
      elbowAngleRangeDeg:
        elbowAngles.length > 0
          ? { min: Math.min(...elbowAngles), max: Math.max(...elbowAngles) }
          : null,
      armAlternationDetected:
        wristDiffs.length >= 4 ? armSignChanges >= 1 : null,
      lateralArmDriftHigh: avgLateral !== null ? avgLateral > 2.4 : null,
      kneeLiftRelativeToHip:
        maxKneeLift === null
          ? 'Tidak dapat diukur dengan pasti.'
          : maxKneeLift > -0.05
            ? 'Angkatan lutut menghampiri atau melepasi paras pinggul diperhatikan.'
            : 'Angkatan lutut kelihatan rendah berbanding paras pinggul.',
      strideAlternationDetected:
        ankleDiffs.length >= 4 ? ankleSignChanges >= 1 : null,
      footVisibilityNotes:
        feetVisibleFrames >= Math.max(3, detectedPoseFrames * 0.55)
          ? `Pergelangan kaki/kaki kelihatan dalam ${feetVisibleFrames} daripada ${detectedPoseFrames} bingkai.`
          : 'Bahagian kaki kerap terpotong, jauh atau tidak cukup jelas untuk pengesahan K4.',
      keyframes,
    };

    onProgress?.('Pra-semakan dan pengekstrakan postur selesai.', 95);

    return {
      qualityReport,
      poseTelemetry,
      keyframes: keyframes.map(({ timestampSec, dataUrl, phaseLabel }) => ({
        timestampSec,
        dataUrl,
        phaseLabel,
      })),
    };
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}
