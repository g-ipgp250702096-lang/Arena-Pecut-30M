import React, { useEffect, useRef, useState } from 'react';
import {
  Upload,
  Video,
  Trash2,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  Camera,
  StopCircle,
  Loader2,
  ArrowRight,
  ArrowLeft,
  Play,
  Pause,
  RotateCcw,
  Save,
  Gauge,
  Crosshair,
  Sparkles,
  ScanLine,
  PlusCircle,
} from 'lucide-react';
import {
  AttemptRecord,
  FrameAnalysisResult,
  NormalizedLandmark,
  TechniqueStatus,
} from '../types/arena';
import { ASSETS, RECORDING_TIPS } from '../data/curriculumContent';
import {
  analyzeSelectedFrame,
  drawFullBodySkeletonOnCanvas,
  ExtractedFrame,
  extractFrameAtTimestamp,
} from '../services/framePoseAnalyzer';

export interface UploadedVideoSession {
  file: File;
  previewUrl: string;
  pendingFrame?: ExtractedFrame | null;
  lastTimestampSec?: number;
}

type LabStep = 'upload_select' | 'confirm_frame' | 'result';

interface VideoAnalysisLabProps {
  attemptNumber: 1 | 2 | 3;
  attemptRecord: AttemptRecord;
  previousFocus?: string;
  videoSession?: UploadedVideoSession;
  onVideoSessionChange: (
    attemptNum: 1 | 2 | 3,
    updater: (prev: UploadedVideoSession | undefined) => UploadedVideoSession | undefined
  ) => void;
  onAttemptUpdated: (updated: AttemptRecord) => void;
  onGoNextAttempt: (nextAttempt: 2 | 3) => void;
  onGoToValidation: () => void;
}

const PoseAnnotatedCanvas: React.FC<{
  dataUrl: string;
  landmarks: NormalizedLandmark[] | null;
  timestampSec: number;
  width: number;
  height: number;
}> = ({ dataUrl, landmarks, timestampSec, width, height }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !dataUrl) return;
    drawFullBodySkeletonOnCanvas(canvas, dataUrl, landmarks);
  }, [dataUrl, landmarks]);

  const isPortrait = height > width;

  return (
    <div className="rounded-2xl border border-[#26B9D1]/40 bg-black/90 p-3 space-y-2.5">
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
        <span className="font-mono-data font-bold text-[#26B9D1]">
          DETIK DIPILIH: {timestampSec.toFixed(2)}s
        </span>
        <span className="font-mono-data text-[#C6BBE6]">
          {width}×{height} · {isPortrait ? 'Portrait (Nisbah Asal)' : 'Landskap (Nisbah Asal)'}
        </span>
      </div>
      <div className="flex justify-center rounded-xl bg-black p-1">
        <canvas
          ref={canvasRef}
          className="block w-auto max-w-full h-auto max-h-[72vh] object-contain"
        />
      </div>
    </div>
  );
};

export const VideoAnalysisLab: React.FC<VideoAnalysisLabProps> = ({
  attemptNumber,
  attemptRecord,
  previousFocus,
  videoSession,
  onVideoSessionChange,
  onAttemptUpdated,
  onGoNextAttempt,
  onGoToValidation,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const frameAnalyses = attemptRecord.frameAnalyses || [];

  const [step, setStep] = useState<LabStep>(() => {
    if (videoSession?.pendingFrame) return 'confirm_frame';
    if (frameAnalyses.length > 0) return 'result';
    return 'upload_select';
  });
  const [selectedFrameId, setSelectedFrameId] = useState<string | null>(
    frameAnalyses[frameAnalyses.length - 1]?.id || null
  );

  // Video player states
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(videoSession?.lastTimestampSec || 0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState<0.5 | 1>(1);
  const [videoDims, setVideoDims] = useState<{ w: number; h: number } | null>(null);

  // Analysis / extraction states
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isAnalyzingFrame, setIsAnalyzingFrame] = useState(false);

  // Camera capture states
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const liveVideoRef = useRef<HTMLVideoElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const recordTimerRef = useRef<number | null>(null);

  // O3 Reflection form state
  const [o3Aspect, setO3Aspect] = useState(attemptRecord.o3IdentifiedAspect || '');
  const [o3Plan, setO3Plan] = useState(attemptRecord.o3ActionPlan || '');
  const [o3Saved, setO3Saved] = useState(Boolean(attemptRecord.o3IdentifiedAspect));

  // Sync only when switching attemptNumber (keep videoSession untouched!)
  useEffect(() => {
    setUploadError(null);
    setIsAnalyzingFrame(false);
    setIsPlaying(false);
    setCurrentTime(videoSession?.lastTimestampSec || 0);
    setDuration(0);
    setVideoDims(null);

    const list = attemptRecord.frameAnalyses || [];
    setSelectedFrameId(list[list.length - 1]?.id || null);

    if (videoSession?.pendingFrame) {
      setStep('confirm_frame');
    } else if (list.length > 0) {
      setStep('result');
    } else {
      setStep('upload_select');
    }

    setO3Aspect(attemptRecord.o3IdentifiedAspect || '');
    setO3Plan(attemptRecord.o3ActionPlan || '');
    setO3Saved(Boolean(attemptRecord.o3IdentifiedAspect));
    stopCameraStream();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attemptNumber]);

  useEffect(() => {
    return () => {
      stopCameraStream();
    };
  }, []);

  const stopCameraStream = () => {
    if (recordTimerRef.current) {
      window.clearInterval(recordTimerRef.current);
      recordTimerRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((t) => t.stop());
      mediaStreamRef.current = null;
    }
    setIsCameraOpen(false);
    setIsRecording(false);
    setRecordSeconds(0);
  };

  const handleOpenCamera = async () => {
    setUploadError(null);
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setUploadError(
        'Pelayar ini tidak menyokong rakaman kamera terus. Sila gunakan butang Muat Naik Video.'
      );
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 30 },
        },
        audio: false,
      });
      mediaStreamRef.current = stream;
      setIsCameraOpen(true);
      window.setTimeout(() => {
        if (liveVideoRef.current) {
          liveVideoRef.current.srcObject = stream;
          liveVideoRef.current.play().catch(() => {});
        }
      }, 60);
    } catch {
      setUploadError(
        'Akses kamera tidak dibenarkan atau tiada kamera dikesan. Anda masih boleh memuat naik fail video sedia ada.'
      );
    }
  };

  const handleStartRecording = () => {
    if (!mediaStreamRef.current) return;
    recordedChunksRef.current = [];
    const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
      ? 'video/webm;codecs=vp9'
      : 'video/webm';
    const recorder = new MediaRecorder(mediaStreamRef.current, { mimeType });
    mediaRecorderRef.current = recorder;

    recorder.ondataavailable = (ev) => {
      if (ev.data.size > 0) recordedChunksRef.current.push(ev.data);
    };

    recorder.onstop = () => {
      const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
      const capturedFile = new File(
        [blob],
        `pecut-percubaan-${attemptNumber}.webm`,
        { type: 'video/webm' }
      );
      stopCameraStream();
      handleSelectedFile(capturedFile);
    };

    recorder.start(250);
    setIsRecording(true);
    setRecordSeconds(0);
    recordTimerRef.current = window.setInterval(() => {
      setRecordSeconds((s) => s + 1);
    }, 1000);
  };

  const handleStopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
  };

  const handleSelectedFile = (file: File) => {
    setUploadError(null);

    const validTypes = [
      'video/mp4',
      'video/webm',
      'video/quicktime',
      'video/x-msvideo',
      'video/x-matroska',
    ];
    const baseType = (file.type || '').split(';')[0].trim();
    if (!validTypes.includes(baseType) && !/\.(mp4|webm|mov|avi|mkv)$/i.test(file.name)) {
      setUploadError(
        'Format fail tidak disokong. Sila pilih fail video MP4, WebM atau MOV.'
      );
      return;
    }
    if (file.size > 40 * 1024 * 1024) {
      setUploadError(
        'Saiz fail terlalu besar (> 40 MB). Sila pilih klip larian 30 meter yang lebih ringkas.'
      );
      return;
    }
    if (file.size < 5 * 1024) {
      setUploadError('Fail video kelihatan kosong atau rosak.');
      return;
    }

    const preview = URL.createObjectURL(file);
    onVideoSessionChange(attemptNumber, (prev) => {
      if (prev?.previewUrl) {
        URL.revokeObjectURL(prev.previewUrl);
      }
      return {
        file,
        previewUrl: preview,
        pendingFrame: null,
        lastTimestampSec: 0,
      };
    });

    setCurrentTime(0);
    setDuration(0);
    setIsPlaying(false);
    setStep('upload_select');
  };

  const handleDeleteVideo = () => {
    onVideoSessionChange(attemptNumber, (prev) => {
      if (prev?.previewUrl) URL.revokeObjectURL(prev.previewUrl);
      return undefined;
    });
    setUploadError(null);
    setCurrentTime(0);
    setDuration(0);
    setIsPlaying(false);
    setStep('upload_select');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Video Player Controls
  const handlePlay = () => {
    const vid = videoRef.current;
    if (!vid) return;
    if (vid.ended || (duration > 0 && vid.currentTime >= duration - 0.04)) {
      vid.currentTime = 0;
    }
    vid.playbackRate = playbackRate;
    vid.play().catch(() => {});
  };

  const handlePause = () => {
    videoRef.current?.pause();
  };

  const handleReplay = () => {
    const vid = videoRef.current;
    if (!vid) return;
    vid.currentTime = 0;
    vid.playbackRate = playbackRate;
    vid.play().catch(() => {});
  };

  const handleToggleRate = () => {
    const nextRate: 0.5 | 1 = playbackRate === 1 ? 0.5 : 1;
    setPlaybackRate(nextRate);
    if (videoRef.current) {
      videoRef.current.playbackRate = nextRate;
    }
  };

  const handleScrub = (nextTime: number) => {
    const clamped = Math.max(0, Math.min(duration || 0, nextTime));
    setCurrentTime(clamped);
    if (videoRef.current) {
      videoRef.current.currentTime = clamped;
    }
    onVideoSessionChange(attemptNumber, (prev) =>
      prev ? { ...prev, lastTimestampSec: clamped } : prev
    );
  };

  const handleNudgeTime = (deltaSec: number) => {
    if (videoRef.current && !videoRef.current.paused) {
      videoRef.current.pause();
    }
    const base = videoRef.current ? videoRef.current.currentTime : currentTime;
    handleScrub(base + deltaSec);
  };

  // STEP 2 TRIGGER: Extract ONLY ONE frame at exact currentTime
  const handleExtractSelectedFrame = () => {
    const vid = videoRef.current;
    if (!vid) return;
    setUploadError(null);
    if (!vid.paused) vid.pause();

    try {
      const extracted = extractFrameAtTimestamp(vid);
      onVideoSessionChange(attemptNumber, (prev) =>
        prev
          ? {
              ...prev,
              pendingFrame: extracted,
              lastTimestampSec: extracted.timestampSec,
            }
          : prev
      );
      setStep('confirm_frame');
    } catch (err: unknown) {
      setUploadError(
        err instanceof Error
          ? err.message
          : 'Gagal mengekstrak gambar daripada video pada detik ini.'
      );
    }
  };

  // STEP 3 TRIGGER: Analyze ONLY the extracted single frame with MediaPipe Pose
  const handleAnalyzePendingFrame = async () => {
    const pending = videoSession?.pendingFrame;
    if (!pending) return;

    setUploadError(null);
    setIsAnalyzingFrame(true);

    try {
      const frameResult = await analyzeSelectedFrame(pending);
      const updatedFrames = [...frameAnalyses, frameResult];

      if (!o3Aspect.trim()) {
        setO3Aspect(frameResult.priorityFocus);
      }

      const updatedAttempt: AttemptRecord = {
        ...attemptRecord,
        attemptNumber,
        completed: frameResult.poseDetected,
        fileName: videoSession?.file.name || attemptRecord.fileName,
        frameAnalyses: updatedFrames,
        analysis: {
          videoSuitability: frameResult.poseDetected ? 'SESUAI' : 'TIDAK_SESUAI',
          selectedTimestampSec: frameResult.timestampSec,
          overallSummaryArif: frameResult.overallSummaryArif,
          overallSummaryAya: frameResult.overallSummaryAya,
          criteria: frameResult.criteria,
          priorityFocus: frameResult.priorityFocus,
          o3CheckPrompt: frameResult.o3CheckPrompt,
          analyzedAt: frameResult.analyzedAt,
          engineNote: frameResult.engineNote,
        },
        updatedAt: new Date().toISOString(),
      };

      onAttemptUpdated(updatedAttempt);
      setSelectedFrameId(frameResult.id);

      onVideoSessionChange(attemptNumber, (prev) =>
        prev ? { ...prev, pendingFrame: null } : prev
      );

      setStep('result');
    } catch (err: unknown) {
      setUploadError(
        err instanceof Error
          ? err.message
          : 'Ralat semasa menjalankan pengesanan pose pada gambar pilihan.'
      );
    } finally {
      setIsAnalyzingFrame(false);
    }
  };

  const handleSelectFrameFromHistory = (frame: FrameAnalysisResult) => {
    setSelectedFrameId(frame.id);
    onAttemptUpdated({
      ...attemptRecord,
      attemptNumber,
      completed: frame.poseDetected || frameAnalyses.some((f) => f.poseDetected),
      analysis: {
        videoSuitability: frame.poseDetected ? 'SESUAI' : 'TIDAK_SESUAI',
        selectedTimestampSec: frame.timestampSec,
        overallSummaryArif: frame.overallSummaryArif,
        overallSummaryAya: frame.overallSummaryAya,
        criteria: frame.criteria,
        priorityFocus: frame.priorityFocus,
        o3CheckPrompt: frame.o3CheckPrompt,
        analyzedAt: frame.analyzedAt,
        engineNote: frame.engineNote,
      },
    });
  };

  const handleDeleteAnalyzedFrame = (frameId: string) => {
    const remaining = frameAnalyses.filter((f) => f.id !== frameId);
    const nextLatest = remaining[remaining.length - 1];

    onAttemptUpdated({
      ...attemptRecord,
      attemptNumber,
      completed: remaining.some((f) => f.poseDetected),
      frameAnalyses: remaining,
      analysis: nextLatest
        ? {
            videoSuitability: nextLatest.poseDetected ? 'SESUAI' : 'TIDAK_SESUAI',
            selectedTimestampSec: nextLatest.timestampSec,
            overallSummaryArif: nextLatest.overallSummaryArif,
            overallSummaryAya: nextLatest.overallSummaryAya,
            criteria: nextLatest.criteria,
            priorityFocus: nextLatest.priorityFocus,
            o3CheckPrompt: nextLatest.o3CheckPrompt,
            analyzedAt: nextLatest.analyzedAt,
            engineNote: nextLatest.engineNote,
          }
        : undefined,
      updatedAt: new Date().toISOString(),
    });

    if (nextLatest) {
      setSelectedFrameId(nextLatest.id);
    } else {
      setSelectedFrameId(null);
      setStep('upload_select');
    }
  };

  const handleChooseAnotherMoment = () => {
    onVideoSessionChange(attemptNumber, (prev) =>
      prev ? { ...prev, pendingFrame: null } : prev
    );
    setStep('upload_select');
  };

  const handleSaveO3Reflection = (e: React.FormEvent) => {
    e.preventDefault();
    if (!o3Aspect.trim()) return;
    onAttemptUpdated({
      ...attemptRecord,
      attemptNumber,
      completed: frameAnalyses.some((f) => f.poseDetected) || Boolean(attemptRecord.analysis),
      fileName: videoSession?.file.name || attemptRecord.fileName,
      o3IdentifiedAspect: o3Aspect.trim(),
      o3ActionPlan: o3Plan.trim(),
      updatedAt: new Date().toISOString(),
    });
    setO3Saved(true);
  };

  const renderStatusStyle = (status: TechniqueStatus) => {
    if (status === 'Memenuhi kriteria berdasarkan gambar') {
      return {
        icon: <CheckCircle2 className="h-4 w-4 text-[#26B9D1] shrink-0" />,
        textClass: 'text-[#26B9D1]',
        borderClass: 'border-[#26B9D1]/35 bg-[#26B9D1]/10',
      };
    }
    if (status === 'Perlu penambahbaikan') {
      return {
        icon: <AlertTriangle className="h-4 w-4 text-[#FFC94A] shrink-0" />,
        textClass: 'text-[#FFC94A]',
        borderClass: 'border-[#FFC94A]/35 bg-[#FFC94A]/10',
      };
    }
    return {
      icon: <HelpCircle className="h-4 w-4 text-[#C6BBE6] shrink-0" />,
      textClass: 'text-[#C6BBE6]',
      borderClass: 'border-white/20 bg-white/5',
    };
  };

  const activeFrame =
    frameAnalyses.find((f) => f.id === selectedFrameId) ||
    frameAnalyses[frameAnalyses.length - 1] ||
    null;

  return (
    <div className="space-y-6">
      {/* Shared Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="video/mp4,video/webm,video/quicktime,video/x-msvideo,.mp4,.webm,.mov,.avi,.mkv"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleSelectedFile(f);
        }}
      />

      {/* Header & Step Progress */}
      <div className="rounded-2xl border border-white/15 bg-[#201146] p-5 space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-2xl">
            <div className="text-xs font-bold text-[#26B9D1]">
              ANALISIS BINGKAI PILIHAN MURID · PERCUBAAN {attemptNumber} DARIPADA 3
            </div>
            <h3 className="font-display mt-1 text-xl font-bold text-[#F7F5FC]">
              {step === 'upload_select' &&
                'Langkah 1 & 2: Muat Naik Video & Pilih Detik'}
              {step === 'confirm_frame' &&
                'Langkah 3: Semak & Sahkan Gambar Detik Terpilih'}
              {step === 'result' &&
                `Langkah 4: Hasil Pengesanan Pose & Maklum Balas K1–K4`}
            </h3>
            {previousFocus && (
              <p className="mt-1.5 text-xs text-[#FFC94A]">
                Fokus Pembetulan (O3) daripada percubaan lalu:{' '}
                <span className="font-semibold">{previousFocus}</span>
              </p>
            )}
          </div>

          {/* 3-Step Indicator */}
          <div className="flex flex-wrap items-center gap-1.5 rounded-xl bg-[#160B33] p-1 border border-white/10 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setStep('upload_select')}
              className={`cursor-pointer rounded-lg px-3 py-1.5 transition-colors ${
                step === 'upload_select'
                  ? 'bg-[#26B9D1] text-[#14092E]'
                  : 'text-[#C6BBE6] hover:text-white'
              }`}
            >
              1. Pilih Detik Video
            </button>
            <span className="text-white/25">→</span>
            <button
              type="button"
              disabled={!videoSession?.pendingFrame}
              onClick={() => videoSession?.pendingFrame && setStep('confirm_frame')}
              className={`rounded-lg px-3 py-1.5 transition-colors ${
                step === 'confirm_frame'
                  ? 'bg-[#FFC94A] text-[#14092E]'
                  : videoSession?.pendingFrame
                    ? 'cursor-pointer text-[#C6BBE6] hover:text-white'
                    : 'text-[#8E82B5] cursor-not-allowed'
              }`}
            >
              2. Sahkan Gambar
            </button>
            <span className="text-white/25">→</span>
            <button
              type="button"
              disabled={frameAnalyses.length === 0}
              onClick={() => frameAnalyses.length > 0 && setStep('result')}
              className={`rounded-lg px-3 py-1.5 transition-colors ${
                step === 'result'
                  ? 'bg-[#26B9D1] text-[#14092E]'
                  : frameAnalyses.length > 0
                    ? 'cursor-pointer text-[#C6BBE6] hover:text-white'
                    : 'text-[#8E82B5] cursor-not-allowed'
              }`}
            >
              3. Analisis & K1–K4
            </button>
          </div>
        </div>

        <p className="text-xs leading-relaxed text-[#D5CCE8]">
          Mainkan video larian pecut kamu, gerakkan garis masa ke detik yang dikehendaki, dan tekan{' '}
          <strong className="text-[#FFC94A]">PILIH BINGKAI INI</strong>. Sistem hanya menganalisis gambar pada detik pilihan kamu menggunakan pengesanan pose tempatan tanpa menyunting atau memotong bahagian kaki.
        </p>

        {step === 'upload_select' && !videoSession?.previewUrl && (
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 border-t border-white/10 pt-4">
            {RECORDING_TIPS.map((tip, idx) => (
              <div key={idx} className="flex items-start gap-2 text-xs text-[#C6BBE6]">
                <span className="font-mono-data font-bold text-[#26B9D1]">0{idx + 1}.</span>
                <span>{tip}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ================================================================= */}
      {/* STEP 1: UPLOAD VIDEO + INTERACTIVE PLAYER + PILIH BINGKAI INI     */}
      {/* ================================================================= */}
      {step === 'upload_select' && (
        <div className="grid gap-6 lg:grid-cols-12 items-start">
          {/* Left: Video Player (Preserves Original Portrait / Landscape Ratio) */}
          <div className="lg:col-span-7 rounded-2xl border border-white/15 bg-[#201146] p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h4 className="font-display text-base font-bold text-[#F7F5FC]">
                Pemain Video & Pemilihan Detik
              </h4>
              {videoSession?.previewUrl && (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="cursor-pointer inline-flex items-center gap-1.5 rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-medium text-[#F7F5FC] hover:bg-white/10"
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                    Ganti Video
                  </button>
                  <button
                    type="button"
                    onClick={handleDeleteVideo}
                    className="cursor-pointer inline-flex items-center gap-1.5 rounded-lg border border-red-400/30 bg-red-500/10 px-3 py-1.5 text-xs font-medium text-red-200 hover:bg-red-500/20"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Padam
                  </button>
                </div>
              )}
            </div>

            {isCameraOpen ? (
              <div className="space-y-3">
                <div className="relative flex justify-center rounded-xl border border-[#26B9D1]/40 bg-black p-1">
                  <video
                    ref={liveVideoRef}
                    muted
                    playsInline
                    className="block max-h-[65vh] w-auto max-w-full object-contain"
                  />
                  {isRecording && (
                    <div className="absolute top-3 left-3 rounded-md bg-red-600 px-2.5 py-1 font-mono-data text-xs font-bold text-white">
                      MERAKAM · {recordSeconds}s
                    </div>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  {!isRecording ? (
                    <button
                      type="button"
                      onClick={handleStartRecording}
                      className="cursor-pointer inline-flex items-center gap-2 rounded-lg bg-[#FFC94A] px-4 py-2 text-xs font-bold text-[#14092E] hover:bg-[#ffd56e]"
                    >
                      <Camera className="h-4 w-4" />
                      Mula Rakam
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleStopRecording}
                      className="cursor-pointer inline-flex items-center gap-2 rounded-lg bg-red-500 px-4 py-2 text-xs font-bold text-white hover:bg-red-600"
                    >
                      <StopCircle className="h-4 w-4" />
                      Tamat Rakaman
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={stopCameraStream}
                    className="cursor-pointer rounded-lg border border-white/15 bg-white/5 px-4 py-2 text-xs text-[#F7F5FC] hover:bg-white/10"
                  >
                    Batal Kamera
                  </button>
                </div>
              </div>
            ) : videoSession?.previewUrl ? (
              <div className="space-y-3">
                <div className="flex justify-center rounded-xl border border-[#26B9D1]/40 bg-black p-1">
                  <video
                    ref={videoRef}
                    src={videoSession.previewUrl}
                    muted
                    playsInline
                    onLoadedMetadata={(e) => {
                      const vid = e.currentTarget;
                      if (Number.isFinite(vid.duration)) setDuration(vid.duration);
                      if (vid.videoWidth && vid.videoHeight) {
                        setVideoDims({ w: vid.videoWidth, h: vid.videoHeight });
                      }
                      if (videoSession.lastTimestampSec && videoSession.lastTimestampSec > 0) {
                        vid.currentTime = Math.min(
                          vid.duration || videoSession.lastTimestampSec,
                          videoSession.lastTimestampSec
                        );
                      }
                      vid.playbackRate = playbackRate;
                    }}
                    onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
                    onPlay={() => setIsPlaying(true)}
                    onPause={() => setIsPlaying(false)}
                    onEnded={() => setIsPlaying(false)}
                    className="block max-h-[68vh] w-auto max-w-full object-contain"
                  />
                </div>

                {/* Timeline Scrubber & Timestamp Readout */}
                <div className="rounded-xl border border-white/10 bg-[#160B33] p-3.5 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                    <span className="font-mono-data font-bold text-[#FFC94A]">
                      Masa Semasa: {currentTime.toFixed(2)}s / {duration.toFixed(2)}s
                    </span>
                    {videoDims && (
                      <span className="font-mono-data text-[11px] text-[#C6BBE6]">
                        {videoDims.w}×{videoDims.h} ({videoDims.h > videoDims.w ? 'Portrait' : 'Landskap'})
                      </span>
                    )}
                  </div>

                  <input
                    type="range"
                    min={0}
                    max={duration > 0 ? duration : 1}
                    step={0.01}
                    value={Math.min(currentTime, duration > 0 ? duration : 1)}
                    onChange={(e) => handleScrub(Number(e.target.value))}
                    aria-label="Pilih detik pada garis masa video"
                    className="w-full accent-[#26B9D1] cursor-pointer"
                  />

                  {/* Playback & Frame-Step Controls */}
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <button
                        type="button"
                        onClick={handlePlay}
                        disabled={isPlaying}
                        className="cursor-pointer inline-flex items-center gap-1.5 rounded-lg bg-[#26B9D1] px-3 py-1.5 text-xs font-bold text-[#14092E] hover:bg-[#49CFE3] disabled:opacity-45 disabled:cursor-default"
                      >
                        <Play className="h-3.5 w-3.5" />
                        Main
                      </button>
                      <button
                        type="button"
                        onClick={handlePause}
                        disabled={!isPlaying}
                        className="cursor-pointer inline-flex items-center gap-1.5 rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-semibold text-[#F7F5FC] hover:bg-white/10 disabled:opacity-45 disabled:cursor-default"
                      >
                        <Pause className="h-3.5 w-3.5" />
                        Jeda
                      </button>
                      <button
                        type="button"
                        onClick={handleReplay}
                        className="cursor-pointer inline-flex items-center gap-1.5 rounded-lg bg-[#7042C5] px-3 py-1.5 text-xs font-bold text-white hover:bg-[#8255D6]"
                      >
                        <RotateCcw className="h-3.5 w-3.5" />
                        Ulang
                      </button>
                      <button
                        type="button"
                        onClick={() => handleNudgeTime(-0.1)}
                        className="cursor-pointer rounded-lg border border-white/15 bg-white/5 px-2.5 py-1.5 font-mono-data text-[11px] font-semibold text-[#C6BBE6] hover:text-white"
                      >
                        -0.1s
                      </button>
                      <button
                        type="button"
                        onClick={() => handleNudgeTime(0.1)}
                        className="cursor-pointer rounded-lg border border-white/15 bg-white/5 px-2.5 py-1.5 font-mono-data text-[11px] font-semibold text-[#C6BBE6] hover:text-white"
                      >
                        +0.1s
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={handleToggleRate}
                      className={`cursor-pointer inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[11px] font-semibold transition-colors ${
                        playbackRate === 0.5
                          ? 'border-[#FFC94A]/50 bg-[#FFC94A]/15 text-[#FFC94A]'
                          : 'border-white/15 bg-white/5 text-[#C6BBE6] hover:text-white'
                      }`}
                    >
                      <Gauge className="h-3.5 w-3.5" />
                      {playbackRate === 0.5 ? '0.5x Perlahan' : '1.0x Normal'}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-white/20 bg-[#160B33] px-6 py-12 text-center">
                <Video className="h-11 w-11 text-[#26B9D1]" />
                <p className="mt-3 text-sm font-semibold text-[#F7F5FC]">
                  Muat naik video larian pecut 30 meter
                </p>
                <p className="mt-1 text-xs text-[#C6BBE6]">
                  Menyokong video Portrait (9:16) dan Landskap · MP4, WebM, MOV
                </p>
                <div className="mt-5 flex flex-wrap justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="cursor-pointer inline-flex items-center gap-2 rounded-xl bg-[#26B9D1] px-4 py-2.5 text-xs font-bold text-[#14092E] hover:bg-[#49CFE3]"
                  >
                    <Upload className="h-4 w-4" />
                    Muat Naik Video
                  </button>
                  <button
                    type="button"
                    onClick={handleOpenCamera}
                    className="cursor-pointer inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/5 px-4 py-2.5 text-xs font-semibold text-[#F7F5FC] hover:bg-white/10"
                  >
                    <Camera className="h-4 w-4 text-[#FFC94A]" />
                    Rakam Guna Kamera
                  </button>
                </div>
              </div>
            )}

            {uploadError && (
              <div className="flex items-start gap-2.5 rounded-xl border border-red-400/40 bg-red-500/15 p-3.5 text-xs text-red-100">
                <AlertTriangle className="h-4 w-4 shrink-0 text-red-300" />
                <span>{uploadError}</span>
              </div>
            )}
          </div>

          {/* Right: Arif & Aya Guidance + PILIH BINGKAI INI Action */}
          <div className="lg:col-span-5 rounded-2xl border border-white/15 bg-[#201146] p-5 space-y-5">
            <h4 className="font-display text-base font-bold text-[#F7F5FC]">
              Panduan Pemilihan Detik
            </h4>

            <div className="space-y-3">
              <div className="flex items-start gap-3 rounded-xl border border-white/10 bg-[#160B33] p-3">
                <div className="h-12 w-10 shrink-0 overflow-hidden rounded-lg border border-[#FFC94A]/40 bg-[#281653] pt-0.5">
                  <img
                    src={ASSETS.ayaPortrait}
                    alt="Aya Ejen Analisis"
                    referrerPolicy="no-referrer"
                    className="h-full w-full object-contain object-top"
                  />
                </div>
                <div className="text-xs leading-relaxed text-[#D5CCE8]">
                  <div className="font-bold text-[#FFC94A]">Aya · Ejen Analisis</div>
                  <p className="mt-0.5">
                    {videoSession?.previewUrl
                      ? 'Gerakkan garis masa ke detik di mana keseluruhan badan dari kepala hingga kedua-dua kasut kelihatan jelas, kemudian tekan PILIH BINGKAI INI.'
                      : 'Selepas video dimuat naik, kamu boleh memainkan video dan memilih detik tertentu sahaja untuk dianalisis.'}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-xl border border-white/10 bg-[#160B33] p-3">
                <div className="h-12 w-10 shrink-0 overflow-hidden rounded-lg border border-[#26B9D1]/40 bg-[#281653] pt-0.5">
                  <img
                    src={ASSETS.arifPortrait}
                    alt="Arif Ejen Kemahiran"
                    referrerPolicy="no-referrer"
                    className="h-full w-full object-contain object-top"
                  />
                </div>
                <div className="text-xs leading-relaxed text-[#D5CCE8]">
                  <div className="font-bold text-[#26B9D1]">Arif · Ejen Kemahiran</div>
                  <p className="mt-0.5">
                    Kamu boleh pilih satu detik untuk melihat kedudukan kepala dan tangan, dan pilih detik lain untuk melihat kedudukan kaki!
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-white/10 bg-[#160B33] p-4 space-y-2 text-xs text-[#E5DDF5]">
              <div className="font-bold text-[#26B9D1]">Tip Memilih Detik Terbaik:</div>
              <ul className="space-y-1.5 text-[#C6BBE6]">
                <li>• Gunakan <strong className="text-[#F7F5FC]">0.5x Perlahan</strong> atau <strong className="text-[#F7F5FC]">-0.1s / +0.1s</strong> untuk berhenti tepat pada aksi.</li>
                <li>• Pastikan gambar pada detik itu tidak terlalu kabur.</li>
                <li>• Pastikan kepala, tangan, lutut, buku lali dan kasut kelihatan.</li>
              </ul>
            </div>

            <div className="space-y-2.5 pt-2 border-t border-white/10">
              <button
                type="button"
                onClick={handleExtractSelectedFrame}
                disabled={!videoSession?.previewUrl}
                className="cursor-pointer inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#FFC94A] px-5 py-3.5 text-sm font-extrabold text-[#14092E] hover:bg-[#ffd56e] transition-colors shadow-lg disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Crosshair className="h-4 w-4" />
                PILIH BINGKAI INI ({currentTime.toFixed(2)}s)
              </button>

              {frameAnalyses.length > 0 && (
                <button
                  type="button"
                  onClick={() => setStep('result')}
                  className="cursor-pointer inline-flex w-full items-center justify-center gap-2 rounded-xl border border-[#26B9D1]/40 bg-[#26B9D1]/10 px-4 py-2.5 text-xs font-bold text-[#26B9D1] hover:bg-[#26B9D1]/20"
                >
                  Lihat Analisis Detik Sedia Ada ({frameAnalyses.length} detik)
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* STEP 2: EXTRACTED FRAME PREVIEW (UNCROPPED) + CONFIRM BUTTONS     */}
      {/* ================================================================= */}
      {step === 'confirm_frame' && videoSession?.pendingFrame && (
        <div className="grid gap-6 lg:grid-cols-12 items-start">
          {/* Uncropped Frame Preview */}
          <div className="lg:col-span-7 rounded-2xl border border-white/15 bg-[#201146] p-5 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
              <span className="font-mono-data font-bold text-[#FFC94A]">
                DETIK DIPILIH: {videoSession.pendingFrame.timestampSec.toFixed(2)}s
              </span>
              <span className="font-mono-data text-[#C6BBE6]">
                {videoSession.pendingFrame.width}×{videoSession.pendingFrame.height} ·{' '}
                {videoSession.pendingFrame.height > videoSession.pendingFrame.width
                  ? 'Portrait (Nisbah Asal)'
                  : 'Landskap (Nisbah Asal)'}
              </span>
            </div>

            <div className="flex justify-center rounded-xl border border-[#26B9D1]/40 bg-black p-2">
              <img
                src={videoSession.pendingFrame.dataUrl}
                alt={`Bingkai detik ${videoSession.pendingFrame.timestampSec.toFixed(2)} saat`}
                className="block w-auto max-w-full h-auto max-h-[72vh] object-contain"
              />
            </div>
          </div>

          {/* Confirmation Actions */}
          <div className="lg:col-span-5 rounded-2xl border border-white/15 bg-[#201146] p-5 space-y-5">
            <div>
              <div className="text-xs font-bold text-[#26B9D1]">
                PENGESAHAN GAMBAR TERPILIH
              </div>
              <h4 className="font-display mt-1 text-lg font-bold text-[#F7F5FC]">
                Sahkan Gambar Sebelum Analisis
              </h4>
              <p className="mt-1.5 text-xs leading-relaxed text-[#D5CCE8]">
                Pastikan keseluruhan badan daripada kepala hingga kedua-dua kasut kelihatan di dalam gambar ini tanpa terpotong.
              </p>
            </div>

            <div className="flex items-start gap-3 rounded-xl border border-white/10 bg-[#160B33] p-3.5">
              <div className="h-12 w-10 shrink-0 overflow-hidden rounded-lg border border-[#26B9D1]/40 bg-[#281653] pt-0.5">
                <img
                  src={ASSETS.ayaPortrait}
                  alt="Aya Ejen Analisis"
                  referrerPolicy="no-referrer"
                  className="h-full w-full object-contain object-top"
                />
              </div>
              <p className="text-xs leading-relaxed text-[#E5DDF5]">
                <strong className="text-[#26B9D1]">Aya:</strong> Jika gambar ini kabur atau kaki tidak kelihatan, tekan <strong className="text-[#F7F5FC]">PILIH DETIK LAIN</strong>. Jika sudah jelas, tekan <strong className="text-[#FFC94A]">ANALISIS GAMBAR INI</strong>.
              </p>
            </div>

            {uploadError && (
              <div className="flex items-start gap-2.5 rounded-xl border border-red-400/40 bg-red-500/15 p-3.5 text-xs text-red-100">
                <AlertTriangle className="h-4 w-4 shrink-0 text-red-300" />
                <span>{uploadError}</span>
              </div>
            )}

            <div className="space-y-3 pt-2 border-t border-white/10">
              <button
                type="button"
                onClick={handleAnalyzePendingFrame}
                disabled={isAnalyzingFrame}
                className="cursor-pointer inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#FFC94A] px-5 py-3.5 text-sm font-extrabold text-[#14092E] hover:bg-[#ffd56e] transition-colors shadow-lg disabled:opacity-60"
              >
                {isAnalyzingFrame ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    MENGANALISIS GAMBAR INI...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    ANALISIS GAMBAR INI
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>

              <button
                type="button"
                disabled={isAnalyzingFrame}
                onClick={handleChooseAnotherMoment}
                className="cursor-pointer inline-flex w-full items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/5 px-4 py-3 text-xs font-bold text-[#F7F5FC] hover:bg-white/10 disabled:opacity-45"
              >
                <ArrowLeft className="h-3.5 w-3.5 text-[#26B9D1]" />
                PILIH DETIK LAIN
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* STEP 3: POSE SKELETON RESULT + K1–K4 + MULTI-MOMENT + O3          */}
      {/* ================================================================= */}
      {step === 'result' && activeFrame && (
        <div className="space-y-6">
          {/* Additional Timestamp Selector Bar (Pemilihan Detik Tambahan) */}
          <div className="rounded-2xl border border-white/15 bg-[#201146] p-4 sm:p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h4 className="font-display text-base font-bold text-[#F7F5FC]">
                  Detik Gambar Yang Dianalisis ({frameAnalyses.length} detik direkodkan)
                </h4>
                <p className="text-xs text-[#C6BBE6]">
                  Kamu boleh memilih detik lain daripada video asal untuk menganalisis bahagian kepala, tangan atau kaki secara berasingan.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {videoSession?.previewUrl ? (
                  <button
                    type="button"
                    onClick={handleChooseAnotherMoment}
                    className="cursor-pointer inline-flex items-center gap-2 rounded-xl bg-[#FFC94A] px-4 py-2.5 text-xs font-extrabold text-[#14092E] hover:bg-[#ffd56e]"
                  >
                    <PlusCircle className="h-4 w-4" />
                    PILIH DETIK LAIN
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="cursor-pointer inline-flex items-center gap-2 rounded-xl bg-[#26B9D1] px-4 py-2.5 text-xs font-bold text-[#14092E] hover:bg-[#49CFE3]"
                  >
                    <Upload className="h-4 w-4" />
                    Muat Naik Video untuk Detik Lain
                  </button>
                )}
              </div>
            </div>

            {frameAnalyses.length > 0 && (
              <div className="flex flex-wrap gap-3">
                {frameAnalyses.map((fa, idx) => {
                  const isActive = fa.id === activeFrame.id;
                  return (
                    <div
                      key={fa.id}
                      className={`flex items-center gap-3 rounded-xl border p-2.5 transition-colors ${
                        isActive
                          ? 'border-[#26B9D1] bg-[#26B9D1]/15'
                          : 'border-white/15 bg-[#160B33] hover:border-white/30'
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => handleSelectFrameFromHistory(fa)}
                        className="cursor-pointer flex items-center gap-3 text-left"
                      >
                        {fa.frameDataUrl ? (
                          <div className="flex h-16 w-14 shrink-0 items-center justify-center rounded-lg bg-black p-0.5 border border-white/10">
                            <img
                              src={fa.frameDataUrl}
                              alt={`Detik ${fa.timestampSec.toFixed(2)}s`}
                              className="max-h-full max-w-full object-contain"
                            />
                          </div>
                        ) : (
                          <div className="flex h-16 w-14 shrink-0 items-center justify-center rounded-lg bg-[#281653] text-[10px] font-mono-data text-[#C6BBE6]">
                            {fa.timestampSec.toFixed(2)}s
                          </div>
                        )}
                        <div className="text-xs">
                          <div className="font-bold text-[#F7F5FC]">
                            Detik #{idx + 1} · {fa.timestampSec.toFixed(2)}s
                          </div>
                          <div className="mt-0.5 text-[11px] text-[#C6BBE6]">
                            {fa.poseDetected
                              ? `${fa.detectedBodyParts.length}/8 bahagian dikesan`
                              : 'Pose tidak dikesan'}
                          </div>
                        </div>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteAnalyzedFrame(fa.id)}
                        title="Padam analisis detik ini"
                        className="cursor-pointer rounded-lg p-1.5 text-[#C6BBE6] hover:bg-red-500/20 hover:text-red-200"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Annotated Full-Body Image + Summary */}
          <div className="grid gap-6 lg:grid-cols-12 items-start">
            {/* Left: Full Uncropped Annotated Pose Canvas (Zero Foot Cropping!) */}
            <div className="lg:col-span-6 space-y-3">
              {activeFrame.frameDataUrl ? (
                <PoseAnnotatedCanvas
                  dataUrl={activeFrame.frameDataUrl}
                  landmarks={activeFrame.landmarks}
                  timestampSec={activeFrame.timestampSec}
                  width={activeFrame.imageWidth}
                  height={activeFrame.imageHeight}
                />
              ) : (
                <div className="rounded-2xl border border-white/15 bg-[#201146] p-6 text-center text-xs text-[#C6BBE6]">
                  Pratonton gambar daripada sesi pelayar terdahulu tidak disimpan dalam storan setempat, namun keputusan analisis K1–K4 kekal direkodkan di sebelah.
                </div>
              )}

              {/* Detected / Missing Body Parts Summary */}
              <div className="rounded-xl border border-white/15 bg-[#201146] p-4 space-y-2.5 text-xs">
                <div className="flex items-center gap-2 font-bold text-[#26B9D1]">
                  <ScanLine className="h-4 w-4" />
                  <span>Status Pengesanan Anggota Badan (Pose Penuh)</span>
                </div>
                {activeFrame.detectedBodyParts.length > 0 && (
                  <p className="text-[#E5DDF5]">
                    <span className="font-semibold text-[#26B9D1]">Dikesan: </span>
                    {activeFrame.detectedBodyParts.join(', ')}
                  </p>
                )}
                {activeFrame.missingBodyParts.length > 0 && (
                  <div className="rounded-lg border border-[#FFC94A]/35 bg-[#FFC94A]/10 p-3 text-[#FFE8A3] space-y-1">
                    <div>
                      <span className="font-bold text-[#FFC94A]">
                        Tidak dapat dikenal pasti:{' '}
                      </span>
                      {activeFrame.missingBodyParts.join(', ')}
                    </div>
                    <p className="text-[11px]">
                      Kedudukan anggota yang tiada tidak akan direka. Sila tekan{' '}
                      <strong className="text-white">PILIH DETIK LAIN</strong> jika kamu ingin memilih bingkai yang lebih jelas.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Right: Aya & Arif Summaries + Quick Overview */}
            <div className="lg:col-span-6 space-y-4">
              <div className="rounded-2xl border border-white/15 bg-[#201146] p-5 space-y-4">
                <div>
                  <h4 className="font-display text-lg font-bold text-[#F7F5FC]">
                    Ringkasan Analisis Detik {activeFrame.timestampSec.toFixed(2)}s
                  </h4>
                  <p className="mt-1 text-xs text-[#C6BBE6]">{activeFrame.engineNote}</p>
                </div>

                <div className="space-y-3">
                  <div className="flex items-start gap-3 rounded-xl border border-white/10 bg-[#160B33] p-3.5">
                    <div className="h-14 w-12 shrink-0 overflow-hidden rounded-lg border border-[#26B9D1]/40 bg-[#281653] pt-0.5">
                      <img
                        src={ASSETS.ayaPortrait}
                        alt="Aya Ejen Analisis"
                        referrerPolicy="no-referrer"
                        className="h-full w-full object-contain object-top"
                      />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-[#26B9D1]">
                        Aya · Dapatan Landmark Gambar
                      </div>
                      <p className="mt-1 text-xs sm:text-sm leading-relaxed text-[#E5DDF5]">
                        {activeFrame.overallSummaryAya}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 rounded-xl border border-white/10 bg-[#160B33] p-3.5">
                    <div className="h-14 w-12 shrink-0 overflow-hidden rounded-lg border border-[#FFC94A]/40 bg-[#281653] pt-0.5">
                      <img
                        src={ASSETS.arifPortrait}
                        alt="Arif Ejen Kemahiran"
                        referrerPolicy="no-referrer"
                        className="h-full w-full object-contain object-top"
                      />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-[#FFC94A]">
                        Arif · Bimbingan Kemahiran
                      </div>
                      <p className="mt-1 text-xs sm:text-sm leading-relaxed text-[#E5DDF5]">
                        {activeFrame.overallSummaryArif}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* K1–K4 Detailed Cards */}
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
                {activeFrame.criteria.map((c) => {
                  const style = renderStatusStyle(c.status);
                  return (
                    <div
                      key={c.code}
                      className="rounded-xl border border-white/15 bg-[#201146] p-4 space-y-2.5"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <h5 className="font-display text-base font-bold text-[#F7F5FC]">
                          {c.name}
                        </h5>
                        <span className="text-[11px] text-[#C6BBE6]">
                          Keyakinan: <strong className="text-[#F7F5FC]">{c.confidence}</strong>
                        </span>
                      </div>

                      <div
                        className={`inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-bold ${style.borderClass} ${style.textClass}`}
                      >
                        {style.icon}
                        <span>{c.status}</span>
                      </div>

                      <div className="space-y-1.5 text-xs leading-relaxed text-[#E5DDF5]">
                        {c.observedRegion && (
                          <p>
                            <span className="font-semibold text-[#26B9D1]">
                              Kawasan Pemerhatian:{' '}
                            </span>
                            {c.observedRegion}
                          </p>
                        )}
                        <p>
                          <span className="font-semibold text-[#C6BBE6]">
                            Dapatan Visual:{' '}
                          </span>
                          {c.visibleObservation}
                        </p>
                        <p className="text-[11px] text-[#C6BBE6]">
                          <span className="font-semibold">Bukti Geometri: </span>
                          {c.supportingEvidence}
                        </p>
                      </div>

                      <div className="border-t border-white/10 pt-2.5 text-xs text-[#FFE8A3]">
                        <span className="font-semibold text-[#FFC94A]">
                          Cadangan Pembetulan:{' '}
                        </span>
                        {c.improvementSuggestion}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Objective O3 Self-Reflection & Next Attempt */}
          <form
            onSubmit={handleSaveO3Reflection}
            className="rounded-2xl border border-[#26B9D1]/35 bg-[#201146] p-5 space-y-4"
          >
            <div>
              <h5 className="font-display text-base font-bold text-[#F7F5FC]">
                Ruang Refleksi Kendiri & Pembetulan Teknik (Objektif O3)
              </h5>
              <p className="mt-0.5 text-xs text-[#C6BBE6]">{activeFrame.o3CheckPrompt}</p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold text-[#C6BBE6] mb-1.5">
                  Satu aspek teknik yang perlu saya perbaiki / fokuskan:
                </label>
                <input
                  type="text"
                  required
                  value={o3Aspect}
                  onChange={(e) => {
                    setO3Aspect(e.target.value);
                    setO3Saved(false);
                  }}
                  placeholder="Contoh: Angkat lutut lebih aktif (K3)"
                  className="w-full rounded-xl border border-white/15 bg-[#160B33] px-3.5 py-2.5 text-sm text-[#F7F5FC] placeholder-[#8E82B5] focus:border-[#26B9D1] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#C6BBE6] mb-1.5">
                  Tindakan pembetulan pada percubaan berikutnya:
                </label>
                <input
                  type="text"
                  value={o3Plan}
                  onChange={(e) => {
                    setO3Plan(e.target.value);
                    setO3Saved(false);
                  }}
                  placeholder="Contoh: Fokus siku bengkok semula jadi dan sentuhan bebola kaki"
                  className="w-full rounded-xl border border-white/15 bg-[#160B33] px-3.5 py-2.5 text-sm text-[#F7F5FC] placeholder-[#8E82B5] focus:border-[#26B9D1] focus:outline-none"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <button
                type="submit"
                className="cursor-pointer inline-flex items-center gap-2 rounded-xl bg-[#26B9D1] px-4 py-2.5 text-xs font-bold text-[#14092E] hover:bg-[#49CFE3]"
              >
                <Save className="h-3.5 w-3.5" />
                {o3Saved ? 'Refleksi Kendiri Disimpan' : 'Simpan Refleksi Kendiri'}
              </button>

              <div className="flex flex-wrap gap-2">
                {attemptNumber < 3 && (
                  <button
                    type="button"
                    onClick={() => onGoNextAttempt((attemptNumber + 1) as 2 | 3)}
                    className="cursor-pointer inline-flex items-center gap-2 rounded-xl bg-[#7042C5] px-4 py-2.5 text-xs font-bold text-white hover:bg-[#8255D6]"
                  >
                    Seterusnya: Percubaan {attemptNumber + 1}
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={onGoToValidation}
                  className="cursor-pointer inline-flex items-center gap-2 rounded-xl bg-[#FFC94A] px-4 py-2.5 text-xs font-bold text-[#14092E] hover:bg-[#ffd56e]"
                >
                  Rekod Bukti & Pengesahan Guru
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
