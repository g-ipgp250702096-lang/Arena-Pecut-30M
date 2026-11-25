import React, { useEffect, useRef, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  ShieldAlert,
  Timer,
  ClipboardCheck,
} from 'lucide-react';
import {
  AttemptRecord,
  CriterionCode,
  PupilPortfolio,
  SchoolStage,
} from '../types/arena';
import {
  ASSETS,
  MISSION_STEPS,
  SAFETY_RULES,
} from '../data/curriculumContent';
import { SprintSimulator } from './SprintSimulator';
import { UploadedVideoSession, VideoAnalysisLab } from './VideoAnalysisLab';

interface SchoolModeFlowProps {
  portfolio: PupilPortfolio;
  onUpdatePortfolio: (updater: (prev: PupilPortfolio) => PupilPortfolio) => void;
  onBackToModes: () => void;
  onGoToRecords: () => void;
}

const QUICK_PRACTICE_CHECKS = [
  {
    id: 'qc1',
    question: 'K1: Semasa memecut, kepala hendaklah tegak semula jadi dan mata memandang ke...',
    options: ['Bawah kaki', 'Hadapan', 'Sisi kiri'],
    correct: 1,
  },
  {
    id: 'qc2',
    question: 'K2: Bagaimanakah pergerakan tangan yang betul semasa berlari pecut?',
    options: ['Berselang-seli ke hadapan dan ke belakang', 'Melintang di hadapan dada', 'Lurus tanpa membengkokkan siku'],
    correct: 0,
  },
  {
    id: 'qc3',
    question: 'K3: Untuk langkah yang bertenaga dan teratur, lutut perlu...',
    options: ['Dikekalkan rendah', 'Diangkat secara aktif ke hadapan', 'Digerakkan ke sisi'],
    correct: 1,
  },
  {
    id: 'qc4',
    question: 'K4: Apakah peranan bahagian hadapan tapak kaki semasa pecutan?',
    options: ['Membantu tolakan ke hadapan dengan koordinasi baik', 'Berlari semata-mata di atas hujung jari kaki secara kaku', 'Menghentak tumit kuat ke trek'],
    correct: 0,
  },
];

export const SchoolModeFlow: React.FC<SchoolModeFlowProps> = ({
  portfolio,
  onUpdatePortfolio,
  onBackToModes,
  onGoToRecords,
}) => {
  const [stage, setStage] = useState<SchoolStage>('taklimat');
  const [selectedCriterion, setSelectedCriterion] = useState<CriterionCode>('K1');
  const [activeAttempt, setActiveAttempt] = useState<1 | 2 | 3>(1);
  const [quickAnswers, setQuickAnswers] = useState<Record<string, number>>({});
  const [quickSubmitted, setQuickSubmitted] = useState(portfolio.quickCheckCompleted);

  // Preserve uploaded videos & pre-processed telemetry across stages/attempts/O3 saves
  const [uploadedVideos, setUploadedVideos] = useState<
    Partial<Record<1 | 2 | 3, UploadedVideoSession>>
  >({});
  const uploadedVideosRef = useRef(uploadedVideos);
  uploadedVideosRef.current = uploadedVideos;

  useEffect(() => {
    return () => {
      Object.values(uploadedVideosRef.current).forEach((session) => {
        if (session?.previewUrl) {
          URL.revokeObjectURL(session.previewUrl);
        }
      });
    };
  }, []);

  const handleVideoSessionChange = (
    attemptNum: 1 | 2 | 3,
    updater: (prev: UploadedVideoSession | undefined) => UploadedVideoSession | undefined
  ) => {
    setUploadedVideos((prev) => ({
      ...prev,
      [attemptNum]: updater(prev[attemptNum]),
    }));
  };

  const stages: Array<{ id: SchoolStage; label: string }> = [
    { id: 'taklimat', label: '1. Taklimat Misi' },
    { id: 'teknik', label: '2. Teknik K1–K4' },
    { id: 'misi', label: '3. Misi 30 Meter' },
    { id: 'analisis', label: '4. Analisis Bingkai Pilihan' },
  ];

  const handleSubmitQuickCheck = () => {
    const score = QUICK_PRACTICE_CHECKS.reduce(
      (acc, q) => (quickAnswers[q.id] === q.correct ? acc + 1 : acc),
      0
    );
    setQuickSubmitted(true);
    onUpdatePortfolio((prev) => ({
      ...prev,
      quickCheckCompleted: true,
      quickCheckScore: Math.max(prev.quickCheckScore, score),
    }));
  };

  const currentAttemptRecord =
    portfolio.attempts.find((a) => a.attemptNumber === activeAttempt) || {
      attemptNumber: activeAttempt,
      completed: false,
    };

  const previousAttempt =
    activeAttempt > 1
      ? portfolio.attempts.find((a) => a.attemptNumber === activeAttempt - 1)
      : undefined;

  const previousFocus =
    previousAttempt?.o3IdentifiedAspect ||
    previousAttempt?.analysis?.priorityFocus ||
    undefined;

  const handleAttemptUpdated = (updated: AttemptRecord) => {
    onUpdatePortfolio((prev) => ({
      ...prev,
      attempts: prev.attempts.map((a) =>
        a.attemptNumber === updated.attemptNumber ? updated : a
      ),
    }));
  };

  return (
    <div className="space-y-6">
      {/* Mode Header & Stage Navigation */}
      <div className="rounded-2xl border border-white/15 bg-[#201146] p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <button
              type="button"
              onClick={onBackToModes}
              className="cursor-pointer inline-flex items-center gap-1.5 text-xs font-semibold text-[#26B9D1] hover:text-[#49CFE3]"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Kembali ke Pilihan Mod
            </button>
            <h1 className="font-display mt-1.5 text-2xl font-extrabold text-[#F7F5FC]">
              MOD SEKOLAH · Larian Sebenar 30 Meter
            </h1>
          </div>

          <div className="flex flex-wrap gap-1.5 rounded-xl bg-[#160B33] p-1 border border-white/10">
            {stages.map((st) => (
              <button
                key={st.id}
                type="button"
                onClick={() => setStage(st.id)}
                className={`cursor-pointer whitespace-nowrap rounded-lg px-3 py-2 text-xs font-semibold transition-colors ${
                  stage === st.id
                    ? 'bg-[#26B9D1] text-[#14092E]'
                    : 'text-[#C6BBE6] hover:text-white'
                }`}
              >
                {st.label}
              </button>
            ))}
            <button
              type="button"
              onClick={onGoToRecords}
              className="cursor-pointer whitespace-nowrap rounded-lg px-3 py-2 text-xs font-semibold text-[#FFC94A] hover:bg-white/5"
            >
              5. Pengesahan Guru
            </button>
          </div>
        </div>
      </div>

      {/* STAGE 1: TAKLIMAT MISI */}
      {stage === 'taklimat' && (
        <div className="grid gap-6 lg:grid-cols-12 items-stretch">
          <div className="lg:col-span-8 rounded-2xl border border-white/15 bg-[#201146] p-6 space-y-5">
            <div className="border-b border-white/10 pb-4">
              <div className="text-xs font-bold text-[#26B9D1]">
                PERINGKAT 1 · TAKLIMAT MISI & KESELAMATAN
              </div>
              <h2 className="font-display mt-1 text-2xl font-bold text-[#F7F5FC]">
                Misi Larian Pecut 30 Meter
              </h2>
              <p className="mt-1 text-sm text-[#D5CCE8]">
                Tujuan pembelajaran: Mengenal pasti dan melakukan teknik larian pecut K1–K4 dengan selamat di bawah bimbingan guru Pendidikan Jasmani.
              </p>
            </div>

            {/* Equipment & Teacher Supervision */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-white/10 bg-[#160B33] p-4">
                <h3 className="text-xs font-bold text-[#FFC94A]">Peralatan Diperlukan</h3>
                <p className="mt-1.5 text-xs leading-relaxed text-[#E5DDF5]">
                  Kon penanda jarak 30 meter, laluan trek atau padang rata, wisel guru, pakaian dan kasut sukan, serta peranti kamera yang stabil.
                </p>
              </div>
              <div className="rounded-xl border border-white/10 bg-[#160B33] p-4">
                <h3 className="text-xs font-bold text-[#26B9D1]">Pengawasan Guru</h3>
                <p className="mt-1.5 text-xs leading-relaxed text-[#E5DDF5]">
                  Semua aktiviti larian pecut 30 meter mesti dijalankan di bawah pengawasan dan kebenaran guru Pendidikan Jasmani.
                </p>
              </div>
            </div>

            {/* 7 Official Safety Rules */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-bold text-[#F7F5FC]">
                <ShieldAlert className="h-4 w-4 text-[#FFC94A]" />
                7 Peraturan Keselamatan Wajib
              </div>
              <div className="grid gap-2.5 sm:grid-cols-2">
                {SAFETY_RULES.map((rule, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-2.5 rounded-xl border border-white/10 bg-[#160B33] p-3 text-xs leading-relaxed text-[#E5DDF5]"
                  >
                    <span className="font-mono-data font-bold text-[#26B9D1]">
                      0{idx + 1}.
                    </span>
                    <span>{rule}</span>
                  </div>
                ))}
              </div>
            </div>

            <label className="flex items-center gap-3 rounded-xl border border-[#26B9D1]/35 bg-[#26B9D1]/10 p-4 cursor-pointer">
              <input
                type="checkbox"
                checked={portfolio.safetyAccepted}
                onChange={(e) =>
                  onUpdatePortfolio((prev) => ({
                    ...prev,
                    safetyAccepted: e.target.checked,
                  }))
                }
                className="h-5 w-5 accent-[#26B9D1]"
              />
              <span className="text-sm font-semibold text-[#F7F5FC]">
                Saya telah membaca semua peraturan keselamatan dan mendapat kebenaran guru untuk memulakan aktiviti.
              </span>
            </label>

            <button
              type="button"
              disabled={!portfolio.safetyAccepted}
              onClick={() => setStage('teknik')}
              className="cursor-pointer inline-flex items-center gap-2 rounded-xl bg-[#FFC94A] px-6 py-3.5 text-sm font-extrabold text-[#14092E] hover:bg-[#ffd56e] disabled:opacity-40 disabled:cursor-not-allowed"
            >
              SAYA BERSEDIA
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>

          {/* Character Coach Side Panel */}
          <div className="lg:col-span-4 flex flex-col justify-between rounded-2xl border border-white/15 bg-[#201146] p-6">
            <div className="space-y-4">
              <div className="flex h-80 items-end justify-center overflow-hidden rounded-xl border border-[#26B9D1]/30 bg-gradient-to-b from-[#3A217A]/60 to-[#160B33] pt-3 px-4">
                <img
                  src={ASSETS.arifFull}
                  alt="Arif Ejen Kemahiran"
                  referrerPolicy="no-referrer"
                  className="h-full w-auto object-contain object-bottom"
                />
              </div>
              <div>
                <div className="text-xs font-bold text-[#26B9D1]">
                  PESANAN EJEN ARIF
                </div>
                <p className="mt-1.5 text-sm leading-relaxed text-[#E5DDF5]">
                  “Ejen Pecut yang hebat sentiasa mengutamakan keselamatan! Panaskan badan terlebih dahulu dan periksa permukaan trek sebelum memecut.”
                </p>
              </div>
            </div>

            <div className="mt-4 flex items-center gap-3 rounded-xl border border-white/10 bg-[#160B33] p-3.5">
              <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg border border-[#B34BCB]/40 bg-[#281653] pt-1">
                <img
                  src={ASSETS.ayaPortrait}
                  alt="Aya Ejen Analisis"
                  referrerPolicy="no-referrer"
                  className="h-full w-full object-contain object-top"
                />
              </div>
              <p className="text-xs text-[#D5CCE8]">
                “Selepas ini, kita akan semak 4 kriteria teknik K1–K4 bersama-sama.”
              </p>
            </div>
          </div>
        </div>
      )}

      {/* STAGE 2: IMBAS KEMBALI TEKNIK K1-K4 */}
      {stage === 'teknik' && (
        <div className="space-y-6">
          <SprintSimulator
            selectedCriterion={selectedCriterion}
            onSelectCriterion={setSelectedCriterion}
          />

          {/* Short Practice Check (O1) */}
          <div className="rounded-2xl border border-white/15 bg-[#201146] p-6 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="font-display text-lg font-bold text-[#F7F5FC]">
                  Semakan Pantas Teknik (Persediaan Objektif O1)
                </h3>
                <p className="text-xs text-[#C6BBE6]">
                  Lengkapkan semakan ringkas ini untuk mengesahkan kefahaman kamu tentang K1–K4 sebelum ke trek 30 meter.
                </p>
              </div>
              {quickSubmitted && (
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#26B9D1]">
                  <CheckCircle2 className="h-4 w-4" />
                  Skor Semakan: {portfolio.quickCheckScore} / 4
                </span>
              )}
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {QUICK_PRACTICE_CHECKS.map((item) => (
                <div
                  key={item.id}
                  className="rounded-xl border border-white/10 bg-[#160B33] p-4 space-y-2.5"
                >
                  <p className="text-xs font-semibold text-[#F7F5FC]">
                    {item.question}
                  </p>
                  <div className="space-y-1.5">
                    {item.options.map((opt, idx) => {
                      const selected = quickAnswers[item.id] === idx;
                      let cls =
                        'border-white/10 bg-[#201146] text-[#E5DDF5] hover:border-[#26B9D1]/50';
                      if (quickSubmitted) {
                        if (idx === item.correct) {
                          cls = 'border-[#26B9D1] bg-[#26B9D1]/15 text-[#26B9D1] font-semibold';
                        } else if (selected) {
                          cls = 'border-red-400 bg-red-500/15 text-red-200';
                        }
                      } else if (selected) {
                        cls = 'border-[#FFC94A] bg-[#FFC94A]/15 text-[#FFC94A] font-semibold';
                      }
                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            if (!quickSubmitted) {
                              setQuickAnswers((prev) => ({ ...prev, [item.id]: idx }));
                            }
                          }}
                          className={`cursor-pointer w-full rounded-lg border px-3 py-2 text-left text-xs transition-colors ${cls}`}
                        >
                          {opt}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              {!quickSubmitted ? (
                <button
                  type="button"
                  disabled={Object.keys(quickAnswers).length < QUICK_PRACTICE_CHECKS.length}
                  onClick={handleSubmitQuickCheck}
                  className="cursor-pointer inline-flex items-center gap-2 rounded-xl bg-[#26B9D1] px-5 py-2.5 text-xs font-extrabold text-[#14092E] hover:bg-[#49CFE3] disabled:opacity-40"
                >
                  <ClipboardCheck className="h-4 w-4" />
                  Semak Jawapan Pantas
                </button>
              ) : (
                <span className="text-xs text-[#D5CCE8]">
                  Bukti semakan awal teknik telah direkodkan.
                </span>
              )}

              <button
                type="button"
                onClick={() => setStage('misi')}
                className="cursor-pointer inline-flex items-center gap-2 rounded-xl bg-[#FFC94A] px-6 py-3 text-sm font-extrabold text-[#14092E] hover:bg-[#ffd56e]"
              >
                SAYA FAHAM TEKNIK
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STAGE 3: MISI LARIAN 30 METER */}
      {stage === 'misi' && (
        <div className="rounded-2xl border border-white/15 bg-[#201146] p-6 space-y-6">
          <div className="flex flex-wrap items-start justify-between gap-4 border-b border-white/10 pb-4">
            <div>
              <div className="text-xs font-bold text-[#FFC94A]">
                PERINGKAT 3 · PELAKSANAAN DI TREK 30 METER
              </div>
              <h2 className="font-display mt-1 text-2xl font-bold text-[#F7F5FC]">
                “Lakukan larian pecut sejauh 30 meter dengan menunjukkan teknik larian pecut yang betul.”
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-12 w-10 overflow-hidden rounded-lg border border-[#26B9D1]/40 bg-[#160B33] pt-0.5">
                <img
                  src={ASSETS.arifPortrait}
                  alt="Arif Misi"
                  referrerPolicy="no-referrer"
                  className="h-full w-full object-contain object-top"
                />
              </div>
              <div className="h-12 w-10 overflow-hidden rounded-lg border border-[#FFC94A]/40 bg-[#160B33] pt-0.5">
                <img
                  src={ASSETS.ayaPortrait}
                  alt="Aya Rakaman"
                  referrerPolicy="no-referrer"
                  className="h-full w-full object-contain object-top"
                />
              </div>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <div className="rounded-xl border border-[#26B9D1]/30 bg-[#160B33] p-3.5 text-xs leading-relaxed text-[#E5DDF5]">
              <span className="font-bold text-[#26B9D1]">Arahan Arif (Misi 30 Meter): </span>
              Lakukan larian pecut sejauh 30 meter dengan teknik K1–K4 di bawah pengawasan guru, kemudian perlahankan langkah dengan selamat.
            </div>
            <div className="rounded-xl border border-[#FFC94A]/30 bg-[#160B33] p-3.5 text-xs leading-relaxed text-[#E5DDF5]">
              <span className="font-bold text-[#FFC94A]">Tip Rakaman Aya: </span>
              Pegang kamera dengan stabil dari sisi trek, pastikan pencahayaan terang dan keseluruhan badan kelihatan dari mula hingga tamat.
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {MISSION_STEPS.map((step, i) => (
              <div
                key={i}
                className="rounded-xl border border-white/10 bg-[#160B33] p-4 text-sm leading-relaxed text-[#E5DDF5]"
              >
                <div className="font-mono-data text-xs font-bold text-[#26B9D1]">
                  LANGKAH 0{i + 1}
                </div>
                <p className="mt-1.5">{step}</p>
              </div>
            ))}
          </div>

          {/* Attempt Selector for O2 & O3 */}
          <div className="rounded-xl border border-white/15 bg-[#160B33] p-5">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h3 className="font-display text-base font-bold text-[#F7F5FC]">
                  Pilih Percubaan Larian (Guru menentukan kesesuaian percubaan mengikut keselamatan)
                </h3>
                <p className="mt-1 text-xs text-[#C6BBE6]">
                  Objektif O2 menyasarkan 3 daripada 4 kriteria teknik betul dalam sekurang-kurangnya 2 daripada 3 percubaan. Jangan lakukan pecutan berlebihan tanpa rehat.
                </p>
              </div>
              <div className="flex items-center gap-2 text-xs text-[#26B9D1]">
                <Timer className="h-4 w-4" />
                <span>Rehat 1–2 minit antara percubaan</span>
              </div>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              {([1, 2, 3] as const).map((num) => {
                const rec = portfolio.attempts.find((a) => a.attemptNumber === num);
                const hasPendingUpload = Boolean(uploadedVideos[num]?.previewUrl);
                const selected = activeAttempt === num;
                return (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setActiveAttempt(num)}
                    className={`cursor-pointer rounded-xl border p-4 text-left transition-colors ${
                      selected
                        ? 'border-[#26B9D1] bg-[#26B9D1]/15'
                        : 'border-white/15 bg-[#201146] hover:border-white/30'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-display text-sm font-bold text-[#F7F5FC]">
                        Percubaan {num}
                      </span>
                      {rec?.completed && (
                        <CheckCircle2 className="h-4 w-4 text-[#26B9D1]" />
                      )}
                    </div>
                    <p className="mt-1 text-xs text-[#C6BBE6]">
                      {rec?.frameAnalyses && rec.frameAnalyses.length > 0
                        ? `${rec.frameAnalyses.length} detik bingkai telah dianalisis`
                        : rec?.completed
                          ? 'Analisis telah direkodkan'
                          : hasPendingUpload
                            ? 'Video dimuat naik (sedia memilih detik)'
                            : 'Belum ada rakaman dianalisis'}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex flex-wrap justify-between gap-3">
            <button
              type="button"
              onClick={() => setStage('teknik')}
              className="cursor-pointer inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-xs font-semibold text-[#F7F5FC] hover:bg-white/10"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Semak Semula Teknik
            </button>
            <button
              type="button"
              onClick={() => setStage('analisis')}
              className="cursor-pointer inline-flex items-center gap-2 rounded-xl bg-[#FFC94A] px-6 py-3.5 text-sm font-extrabold text-[#14092E] hover:bg-[#ffd56e]"
            >
              SEDIA UNTUK RAKAMAN (PERCUBAAN {activeAttempt})
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* STAGE 4: ANALISIS VIDEO BERPANDUKAN GURU */}
      {stage === 'analisis' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 bg-[#160B33] p-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-[#C6BBE6]">
                Pilih Percubaan:
              </span>
              {([1, 2, 3] as const).map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => setActiveAttempt(num)}
                  className={`cursor-pointer rounded-lg px-3 py-1.5 text-xs font-bold transition-colors ${
                    activeAttempt === num
                      ? 'bg-[#26B9D1] text-[#14092E]'
                      : 'bg-[#201146] text-[#C6BBE6] hover:text-white'
                  }`}
                >
                  Percubaan {num}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setStage('misi')}
              className="cursor-pointer text-xs font-semibold text-[#26B9D1] hover:underline"
            >
              Lihat Semula Arahan Misi 30m
            </button>
          </div>

          <VideoAnalysisLab
            attemptNumber={activeAttempt}
            attemptRecord={currentAttemptRecord}
            previousFocus={previousFocus}
            videoSession={uploadedVideos[activeAttempt]}
            onVideoSessionChange={handleVideoSessionChange}
            onAttemptUpdated={handleAttemptUpdated}
            onGoNextAttempt={(nextNum) => setActiveAttempt(nextNum)}
            onGoToValidation={onGoToRecords}
          />
        </div>
      )}
    </div>
  );
};

