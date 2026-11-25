import React from 'react';
import {
  ArrowLeft,
  Award,
  CheckCircle2,
  Circle,
  ClipboardCheck,
  Download,
  Home,
  Printer,
  RotateCcw,
  Sparkles,
  Trophy,
  UserCheck,
} from 'lucide-react';
import { ActiveMode, PupilPortfolio, TeacherValidation } from '../types/arena';
import { ASSETS, DETEKTIF_TEKNIK_CASES, HOME_QUIZ_QUESTIONS } from '../data/curriculumContent';
import { safeDownloadBlob, safePrint } from '../utils/iframeSafe';

export interface MissionCompletionStatus {
  activeMode: ActiveMode;
  // School Mode flags
  o1ActivityDone: boolean;
  o2ActivityDone: boolean;
  requiredActivitiesDone: boolean;
  selfReflectionDone: boolean;
  o3TeacherValidated: boolean;
  statusAchieved: boolean;
  // Home Mode flags
  homeDemoDone: boolean;
  homeDetectiveDone: boolean;
  homeMovementDone: boolean;
  homeQuizDone: boolean;
  homeReflectionDone: boolean;
  // Mode-specific final decision
  canFinishMission: boolean;
}

export function getMissionCompletionStatus(
  portfolio: PupilPortfolio,
  modeOverride?: ActiveMode
): MissionCompletionStatus {
  const activeMode: ActiveMode = modeOverride ?? portfolio.activeMode ?? 'school';

  // Strictly isolated School Mode completion checks
  const o1ActivityDone = Boolean(portfolio.quickCheckCompleted);
  const o2ActivityDone = portfolio.attempts.some(
    (a) => a.completed || (a.frameAnalyses && a.frameAnalyses.length > 0)
  );
  const requiredActivitiesDone = o1ActivityDone && o2ActivityDone;
  const selfReflectionDone = portfolio.attempts.some((a) =>
    Boolean(a.o3IdentifiedAspect?.trim())
  );
  const o3TeacherValidated = Boolean(portfolio.teacherValidation.o3Validated);
  const statusAchieved =
    portfolio.teacherValidation.overallStatus === 'Disahkan Mencapai Tahap';

  // Strictly isolated Home Mode completion checks
  const homeDemoDone = Boolean(portfolio.homeDemoCompleted);
  const homeDetectiveDone = Boolean(portfolio.detectiveCompleted);
  const homeMovementDone = Boolean(portfolio.safeChallengeDone);
  const homeQuizDone = Boolean(portfolio.homeQuizSubmitted);
  const homeReflectionDone = Boolean(portfolio.homeReflectionNote?.trim());

  const canFinishMission =
    activeMode === 'home'
      ? homeDemoDone &&
        homeDetectiveDone &&
        homeMovementDone &&
        homeQuizDone &&
        homeReflectionDone
      : requiredActivitiesDone &&
        selfReflectionDone &&
        o3TeacherValidated &&
        statusAchieved;

  return {
    activeMode,
    o1ActivityDone,
    o2ActivityDone,
    requiredActivitiesDone,
    selfReflectionDone,
    o3TeacherValidated,
    statusAchieved,
    homeDemoDone,
    homeDetectiveDone,
    homeMovementDone,
    homeQuizDone,
    homeReflectionDone,
    canFinishMission,
  };
}

interface EvidenceTeacherViewProps {
  portfolio: PupilPortfolio;
  onUpdateTeacherValidation: (validation: TeacherValidation) => void;
  onFinishMission: () => void;
  onRestartAll: () => void;
  onBackToActiveMode: () => void;
  onBackToModes: () => void;
  onMainMenu: () => void;
}

export const EvidenceTeacherView: React.FC<EvidenceTeacherViewProps> = ({
  portfolio,
  onUpdateTeacherValidation,
  onFinishMission,
  onRestartAll,
  onBackToActiveMode,
  onBackToModes,
  onMainMenu,
}) => {
  const tv = portfolio.teacherValidation;
  const missionStatus = getMissionCompletionStatus(portfolio);
  const isHomeMode = missionStatus.activeMode === 'home';

  const quizCorrectCount = HOME_QUIZ_QUESTIONS.reduce(
    (acc, q) => (portfolio.homeQuizAnswers[q.id] === q.correctIndex ? acc + 1 : acc),
    0
  );

  const analyzedAttempts = portfolio.attempts.filter(
    (a) => a.completed && a.analysis
  );

  const attemptsMeeting3of4 = analyzedAttempts.filter((a) => {
    const okCount =
      a.analysis?.criteria.filter(
        (c) => c.status === 'Memenuhi kriteria berdasarkan gambar'
      ).length || 0;
    return okCount >= 3;
  });

  const o3Reflections = portfolio.attempts.filter((a) => Boolean(a.o3IdentifiedAspect));

  const handleExportJson = () => {
    const blob = new Blob([JSON.stringify(portfolio, null, 2)], {
      type: 'application/json',
    });
    const filename = `rekod-arena-pecut-${missionStatus.activeMode}-${(
      portfolio.pupilName || 'murid'
    )
      .toLowerCase()
      .replace(/\s+/g, '-')}.json`;
    safeDownloadBlob(blob, filename);
  };

  return (
    <div className="space-y-6">
      {/* Top Navigation Bar */}
      <div className="no-print flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onBackToActiveMode}
            className="cursor-pointer inline-flex items-center gap-1.5 rounded-xl border border-[#26B9D1]/40 bg-[#26B9D1]/10 px-3.5 py-2 text-xs font-semibold text-[#F7F5FC] hover:bg-[#26B9D1]/20"
          >
            <ArrowLeft className="h-3.5 w-3.5 text-[#26B9D1]" />
            {isHomeMode ? 'Kembali ke Mod Rumah' : 'Kembali ke Mod Sekolah'}
          </button>
          <button
            type="button"
            onClick={onBackToModes}
            className="cursor-pointer inline-flex items-center gap-1.5 rounded-xl border border-white/15 bg-white/5 px-3.5 py-2 text-xs font-semibold text-[#F7F5FC] hover:bg-white/10"
          >
            Pilihan Mod
          </button>
        </div>

        <button
          type="button"
          onClick={onMainMenu}
          className="cursor-pointer inline-flex items-center gap-1.5 rounded-xl border border-white/15 bg-white/5 px-3.5 py-2 text-xs font-semibold text-[#F7F5FC] hover:bg-white/10"
        >
          <Home className="h-3.5 w-3.5 text-[#FFC94A]" />
          Menu Utama
        </button>
      </div>

      {/* Header */}
      <div className="rounded-2xl border border-white/15 bg-[#201146] p-6 space-y-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-[#26B9D1]">
                {isHomeMode
                  ? 'PORTFOLIO PEMBELAJARAN KENDIRI · MOD RUMAH'
                  : 'PORTFOLIO BUKTI PEMBELAJARAN & PENGESAHAN GURU'}
              </span>
              <span
                className={`rounded-md px-2 py-0.5 text-[11px] font-extrabold ${
                  isHomeMode
                    ? 'bg-[#FFC94A]/20 text-[#FFC94A] border border-[#FFC94A]/40'
                    : 'bg-[#26B9D1]/20 text-[#26B9D1] border border-[#26B9D1]/40'
                }`}
              >
                {isHomeMode ? 'Mod Aktif: Mod Rumah' : 'Mod Aktif: Mod Sekolah'}
              </span>
            </div>
            <h1 className="font-display mt-1.5 text-2xl sm:text-3xl font-extrabold text-[#F7F5FC]">
              {isHomeMode
                ? 'Ringkasan Pencapaian Mod Rumah'
                : 'Rekod Pencapaian Objektif (O1–O3)'}
            </h1>
            <p className="mt-1 text-sm text-[#D5CCE8]">
              Murid:{' '}
              <strong className="text-[#F7F5FC]">
                {portfolio.pupilName || 'Belum diisi'}
              </strong>{' '}
              · Kelas:{' '}
              <strong className="text-[#F7F5FC]">
                {portfolio.pupilClass || 'Tahun 5'}
              </strong>
            </p>
            <p className="mt-2 text-xs text-[#FFC94A]">
              {isHomeMode
                ? 'Nota Mod Rumah: Penyelesaian misi dinilai berdasarkan aktiviti pembelajaran kendiri di rumah (simulasi K1–K4, Detektif Teknik, pergerakan selamat, kuiz O1 dan refleksi kendiri) tanpa memerlukan rekod percubaan larian atau pengesahan guru.'
                : 'Nota Penting: Aplikasi ini mengumpulkan bukti pembelajaran secara telus. Kejayaan murid Mod Sekolah tidak diisytiharkan secara automatik tanpa semakan dan pengesahan guru Pendidikan Jasmani.'}
            </p>
          </div>

          <div className="no-print flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                safePrint();
              }}
              className="cursor-pointer inline-flex items-center gap-1.5 rounded-xl border border-white/15 bg-white/5 px-3.5 py-2 text-xs font-semibold text-[#F7F5FC] hover:bg-white/10"
            >
              <Printer className="h-3.5 w-3.5" />
              Cetak Laporan
            </button>
            <button
              type="button"
              onClick={handleExportJson}
              className="cursor-pointer inline-flex items-center gap-1.5 rounded-xl border border-white/15 bg-white/5 px-3.5 py-2 text-xs font-semibold text-[#F7F5FC] hover:bg-white/10"
            >
              <Download className="h-3.5 w-3.5" />
              Muat Turun Rekod
            </button>
          </div>
        </div>

        {/* Arif & Aya Completion Guidance Strip */}
        <div className="grid gap-4 border-t border-white/10 pt-5 md:grid-cols-2">
          <div className="flex items-center gap-3.5 rounded-xl border border-white/10 bg-[#160B33] p-3.5">
            <div className="h-16 w-14 shrink-0 overflow-hidden rounded-lg border border-[#26B9D1]/40 bg-[#281653] pt-1">
              <img
                src={ASSETS.arifPortrait}
                alt="Arif Ejen Kemahiran"
                referrerPolicy="no-referrer"
                className="h-full w-full object-contain object-top"
              />
            </div>
            <div className="text-xs leading-relaxed text-[#E5DDF5]">
              <div className="font-bold text-[#26B9D1]">Arif · Ejen Kemahiran</div>
              <p className="mt-0.5">
                {isHomeMode
                  ? missionStatus.canFinishMission
                    ? '“Hebat! Semua aktiviti Mod Rumah kamu telah lengkap. Tekan butang TAMATKAN MISI di bawah!”'
                    : '“Lengkapkan semua aktiviti Mod Rumah di bawah untuk menyelesaikan misi pembelajaran kendiri kamu.”'
                  : missionStatus.canFinishMission
                    ? '“Semua syarat misi telah lengkap dan disahkan guru. Tekan butang TAMATKAN MISI di bawah!”'
                    : '“Semua rekod percubaan dan refleksi kamu sedia untuk semakan. Lengkapkan syarat di bawah sebelum menamatkan misi.”'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3.5 rounded-xl border border-white/10 bg-[#160B33] p-3.5">
            <div className="h-16 w-14 shrink-0 overflow-hidden rounded-lg border border-[#FFC94A]/40 bg-[#281653] pt-1">
              <img
                src={ASSETS.ayaPortrait}
                alt="Aya Ejen Analisis"
                referrerPolicy="no-referrer"
                className="h-full w-full object-contain object-top"
              />
            </div>
            <div className="text-xs leading-relaxed text-[#E5DDF5]">
              <div className="font-bold text-[#FFC94A]">Aya · Ejen Analisis</div>
              <p className="mt-0.5">
                {isHomeMode
                  ? missionStatus.canFinishMission
                    ? '“Status misi kamu telah lengkap: BERJAYA MENYELESAIKAN MISI PEMBELAJARAN KENDIRI!”'
                    : '“Semak senarai semak Mod Rumah di bawah dan lengkapkan mana-mana stesen yang belum ditanda.”'
                  : '“Tunjukkan rekod ini kepada guru Pendidikan Jasmani kamu untuk semakan dan pengesahan objektif pembelajaran.”'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* =====================================================================
          BRANCH A: MOD RUMAH VIEW (No attempts 1-3, no teacher panel, no O3 teacher validation)
         ===================================================================== */}
      {isHomeMode ? (
        <>
          {/* Home Mode Evidence Cards */}
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-white/15 bg-[#201146] p-5 space-y-2">
              <div className="font-mono-data text-xs font-bold text-[#26B9D1]">
                PEMERHATIAN & DETEKTIF
              </div>
              <h2 className="font-display text-base font-bold text-[#F7F5FC]">
                Demonstrasi K1–K4 & Detektif Teknik
              </h2>
              <p className="text-xs text-[#D5CCE8]">
                Demonstrasi Teknik K1–K4:{' '}
                <strong className={missionStatus.homeDemoDone ? 'text-[#26B9D1]' : 'text-[#FFC94A]'}>
                  {missionStatus.homeDemoDone ? 'Telah diteliti' : 'Belum selesai'}
                </strong>
              </p>
              <p className="text-xs text-[#D5CCE8]">
                Detektif Teknik (4 Kes):{' '}
                <strong className="font-mono-data text-[#F7F5FC]">
                  {portfolio.detectiveCompleted
                    ? `${portfolio.detectiveScore}/${DETEKTIF_TEKNIK_CASES.length}`
                    : 'Belum lengkap'}
                </strong>
              </p>
            </div>

            <div className="rounded-2xl border border-white/15 bg-[#201146] p-5 space-y-2">
              <div className="font-mono-data text-xs font-bold text-[#26B9D1]">
                PERGERAKAN & KUIZ O1
              </div>
              <h2 className="font-display text-base font-bold text-[#F7F5FC]">
                Pergerakan Selamat & Kuiz Pemerhatian
              </h2>
              <p className="text-xs text-[#D5CCE8]">
                Aktiviti Pergerakan Selamat:{' '}
                <strong className={missionStatus.homeMovementDone ? 'text-[#26B9D1]' : 'text-[#FFC94A]'}>
                  {missionStatus.homeMovementDone ? 'Dilengkapkan' : 'Belum ditanda'}
                </strong>
              </p>
              <p className="text-xs text-[#D5CCE8]">
                Kuiz Pemerhatian (O1):{' '}
                <strong className="font-mono-data text-[#F7F5FC]">
                  {portfolio.homeQuizSubmitted
                    ? `${quizCorrectCount}/${HOME_QUIZ_QUESTIONS.length}`
                    : 'Belum dihantar'}
                </strong>
              </p>
            </div>

            <div className="rounded-2xl border border-white/15 bg-[#201146] p-5 space-y-2">
              <div className="font-mono-data text-xs font-bold text-[#26B9D1]">
                REFLEKSI KENDIRI
              </div>
              <h2 className="font-display text-base font-bold text-[#F7F5FC]">
                Catatan Refleksi Mod Rumah
              </h2>
              <p className="text-xs text-[#D5CCE8]">
                Status Refleksi:{' '}
                <strong className={missionStatus.homeReflectionDone ? 'text-[#26B9D1]' : 'text-[#FFC94A]'}>
                  {missionStatus.homeReflectionDone ? 'Telah diisi' : 'Belum diisi'}
                </strong>
              </p>
              {portfolio.homeReflectionNote.trim() && (
                <p className="mt-1 text-xs text-[#E5DDF5] line-clamp-3">
                  “{portfolio.homeReflectionNote}”
                </p>
              )}
            </div>
          </div>

          {/* Home Mode Completion Panel */}
          <div className="rounded-2xl border border-[#26B9D1]/35 bg-[#201146] p-6 space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <Sparkles className="h-5 w-5 text-[#FFC94A]" />
                <h2 className="font-display text-xl font-bold text-[#F7F5FC]">
                  Syarat Penamatan Misi Mod Rumah (Pembelajaran Kendiri)
                </h2>
              </div>
              <span
                className={`rounded-lg px-3 py-1.5 text-xs font-extrabold ${
                  missionStatus.canFinishMission
                    ? 'border border-[#26B9D1]/50 bg-[#26B9D1]/15 text-[#26B9D1]'
                    : 'border border-[#FFC94A]/40 bg-[#FFC94A]/10 text-[#FFC94A]'
                }`}
              >
                {missionStatus.canFinishMission
                  ? 'BERJAYA MENYELESAIKAN MISI PEMBELAJARAN KENDIRI'
                  : 'SEDANG DILAKSANAKAN · LENGKAPKAN SYARAT DI BAWAH'}
              </span>
            </div>

            <div className="grid gap-2.5 sm:grid-cols-2 text-xs">
              {[
                {
                  label: 'Meneliti demonstrasi teknik K1–K4 di Makmal Simulasi',
                  ok: missionStatus.homeDemoDone,
                },
                {
                  label: 'Melengkapkan aktiviti Detektif Teknik K1–K4',
                  ok: missionStatus.homeDetectiveDone,
                },
                {
                  label: 'Melengkapkan aktiviti pergerakan bayangan / Cabaran Pergerakan Selamat',
                  ok: missionStatus.homeMovementDone,
                },
                {
                  label: 'Menjawab dan menghantar semua soalan Kuiz Pemerhatian (O1)',
                  ok: missionStatus.homeQuizDone,
                },
                {
                  label: 'Melengkapkan refleksi kendiri Mod Rumah',
                  ok: missionStatus.homeReflectionDone,
                },
              ].map((req, idx) => (
                <div
                  key={idx}
                  className={`flex items-center gap-2 rounded-lg border px-3 py-2.5 ${
                    req.ok
                      ? 'border-[#26B9D1]/35 bg-[#26B9D1]/10 text-[#F7F5FC]'
                      : 'border-white/10 bg-[#160B33] text-[#C6BBE6]'
                  }`}
                >
                  {req.ok ? (
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-[#26B9D1]" />
                  ) : (
                    <Circle className="h-4 w-4 shrink-0 text-[#8E82B5]" />
                  )}
                  <span>{req.label}</span>
                </div>
              ))}
            </div>

            {missionStatus.canFinishMission ? (
              <div className="no-print pt-2">
                <button
                  type="button"
                  onClick={onFinishMission}
                  className="cursor-pointer inline-flex w-full items-center justify-center gap-2.5 rounded-xl bg-[#FFC94A] px-6 py-4 text-sm sm:text-base font-extrabold text-[#14092E] hover:bg-[#ffd56e] transition-colors shadow-[0_0_25px_rgba(255,201,74,0.35)]"
                >
                  <Trophy className="h-5 w-5" />
                  TAMATKAN MISI
                </button>
              </div>
            ) : (
              <div className="no-print flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 bg-[#160B33] p-4">
                <p className="text-xs text-[#C6BBE6]">
                  Butang <strong className="text-[#FFC94A]">TAMATKAN MISI</strong> akan diaktifkan sebaik sahaja semua 5 syarat Mod Rumah di atas dipenuhi (tiada pengesahan guru diperlukan).
                </p>
                <button
                  type="button"
                  onClick={onBackToActiveMode}
                  className="cursor-pointer rounded-xl bg-[#26B9D1] px-4 py-2 text-xs font-extrabold text-[#14092E] hover:bg-[#49CFE3]"
                >
                  Teruskan Aktiviti Mod Rumah
                </button>
              </div>
            )}

            <div className="no-print flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-4">
              <div className="flex items-center gap-2 text-xs text-[#C6BBE6]">
                <ClipboardCheck className="h-4 w-4 text-[#26B9D1]" />
                <span>
                  Status Misi Mod Rumah:{' '}
                  <strong className="text-[#FFC94A]">
                    {missionStatus.canFinishMission
                      ? 'BERJAYA MENYELESAIKAN MISI PEMBELAJARAN KENDIRI'
                      : 'Belum Lengkap'}
                  </strong>
                </span>
              </div>

              <button
                type="button"
                onClick={onRestartAll}
                className="cursor-pointer inline-flex items-center gap-1.5 rounded-xl border border-red-400/35 bg-red-500/10 px-4 py-2 text-xs font-semibold text-red-200 hover:bg-red-500/20"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Mula Semula Sesi Baharu
              </button>
            </div>
          </div>
        </>
      ) : (
        /* ===================================================================
           BRANCH B: MOD SEKOLAH VIEW (Attempts 1-3 + Teacher O3 Validation)
           =================================================================== */
        <>
          {/* Evidence Cards for O1, O2, O3 */}
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-white/15 bg-[#201146] p-5">
              <div className="font-mono-data text-xs font-bold text-[#26B9D1]">
                BUKTI OBJEKTIF O1
              </div>
              <h2 className="font-display mt-1 text-base font-bold text-[#F7F5FC]">
                Mengenal Pasti Kriteria Teknik
              </h2>
              <p className="mt-2 text-xs text-[#D5CCE8]">
                Semakan Pantas Mod Sekolah:{' '}
                <strong className="font-mono-data text-[#F7F5FC]">
                  {portfolio.quickCheckCompleted
                    ? `${portfolio.quickCheckScore}/4`
                    : 'Belum lengkap'}
                </strong>
              </p>
              <p className="mt-1 text-xs text-[#D5CCE8]">
                Pengakuan Keselamatan:{' '}
                <strong className="text-[#F7F5FC]">
                  {portfolio.safetyAccepted ? 'Disahkan murid' : 'Belum ditanda'}
                </strong>
              </p>
              <div className="mt-4 text-xs font-semibold text-[#FFC94A]">
                Status Guru: {tv.o1Validated ? 'Disahkan Guru' : 'Menunggu Pengesahan Guru'}
              </div>
            </div>

            <div className="rounded-2xl border border-white/15 bg-[#201146] p-5">
              <div className="font-mono-data text-xs font-bold text-[#26B9D1]">
                BUKTI OBJEKTIF O2
              </div>
              <h2 className="font-display mt-1 text-base font-bold text-[#F7F5FC]">
                Larian Pecut 30 Meter (3 Percubaan)
              </h2>
              <p className="mt-2 text-xs text-[#D5CCE8]">
                Percubaan video dinilai:{' '}
                <strong className="font-mono-data text-[#F7F5FC]">
                  {analyzedAttempts.length} / 3
                </strong>
              </p>
              <p className="mt-1 text-xs text-[#D5CCE8]">
                Percubaan dengan ≥ 3 kriteria memenuhi ciri:{' '}
                <strong className="font-mono-data text-[#F7F5FC]">
                  {attemptsMeeting3of4.length} / 3
                </strong>
              </p>
              <div className="mt-4 text-xs font-semibold text-[#FFC94A]">
                Status Guru: {tv.o2Validated ? 'Disahkan Guru' : 'Menunggu Pengesahan Guru'}
              </div>
            </div>

            <div className="rounded-2xl border border-white/15 bg-[#201146] p-5">
              <div className="font-mono-data text-xs font-bold text-[#26B9D1]">
                BUKTI OBJEKTIF O3
              </div>
              <h2 className="font-display mt-1 text-base font-bold text-[#F7F5FC]">
                Refleksi & Pembetulan Teknik
              </h2>
              <p className="mt-2 text-xs text-[#D5CCE8]">
                Aspek penambahbaikan dikenal pasti:{' '}
                <strong className="font-mono-data text-[#F7F5FC]">
                  {o3Reflections.length} rekod
                </strong>
              </p>
              {o3Reflections[0]?.o3IdentifiedAspect && (
                <p className="mt-1 text-xs text-[#E5DDF5] line-clamp-2">
                  Fokus: “{o3Reflections[0].o3IdentifiedAspect}”
                </p>
              )}
              <div className="mt-4 text-xs font-semibold text-[#FFC94A]">
                Status Guru: {tv.o3Validated ? 'Disahkan Guru' : 'Menunggu Pengesahan Guru'}
              </div>
            </div>
          </div>

          {/* Detailed Attempt Breakdown */}
          <div className="rounded-2xl border border-white/15 bg-[#201146] p-6 space-y-4">
            <h2 className="font-display text-lg font-bold text-[#F7F5FC]">
              Ringkasan Percubaan Mod Sekolah (1–3)
            </h2>

            <div className="grid gap-4 md:grid-cols-3">
              {portfolio.attempts.map((att) => (
                <div
                  key={att.attemptNumber}
                  className="rounded-xl border border-white/10 bg-[#160B33] p-4 space-y-2.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-display text-sm font-bold text-[#F7F5FC]">
                      Percubaan {att.attemptNumber}
                    </span>
                    {att.completed ? (
                      <CheckCircle2 className="h-4 w-4 text-[#26B9D1]" />
                    ) : (
                      <span className="text-[11px] text-[#8E82B5]">Belum lengkap</span>
                    )}
                  </div>

                  {att.analysis ? (
                    <div className="space-y-1.5 text-xs">
                      {att.frameAnalyses && att.frameAnalyses.length > 0 && (
                        <div className="text-[11px] text-[#26B9D1] font-mono-data">
                          {att.frameAnalyses.length} detik dianalisis (
                          {att.frameAnalyses
                            .map((f) => `${f.timestampSec.toFixed(2)}s`)
                            .join(', ')}
                          )
                        </div>
                      )}
                      {att.analysis.criteria.map((c) => (
                        <div
                          key={c.code}
                          className="flex items-center justify-between gap-2 border-b border-white/5 pb-1"
                        >
                          <span className="font-semibold text-[#C6BBE6]">{c.code}</span>
                          <span
                            className={
                              c.status === 'Memenuhi kriteria berdasarkan gambar'
                                ? 'text-[#26B9D1] font-semibold text-right'
                                : c.status === 'Perlu penambahbaikan'
                                  ? 'text-[#FFC94A] font-semibold text-right'
                                  : 'text-[#8E82B5] text-right'
                            }
                          >
                            {c.status}
                          </span>
                        </div>
                      ))}
                      {att.o3IdentifiedAspect && (
                        <p className="pt-1 text-[#E5DDF5]">
                          <span className="text-[#FFC94A] font-semibold">Refleksi O3: </span>
                          {att.o3IdentifiedAspect}
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="text-xs text-[#C6BBE6]">
                      Tiada analisis video direkodkan bagi percubaan ini.
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Teacher Validation Panel */}
          <div className="rounded-2xl border border-[#FFC94A]/35 bg-[#201146] p-6 space-y-5">
            <div className="flex items-center gap-2.5">
              <UserCheck className="h-5 w-5 text-[#FFC94A]" />
              <h2 className="font-display text-xl font-bold text-[#F7F5FC]">
                Panel Pengesahan Guru Pendidikan Jasmani
              </h2>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold text-[#C6BBE6] mb-1.5">
                  Nama Guru Penilai
                </label>
                <input
                  type="text"
                  value={tv.teacherName}
                  onChange={(e) =>
                    onUpdateTeacherValidation({ ...tv, teacherName: e.target.value })
                  }
                  placeholder="Contoh: Cikgu Farah binti Razak"
                  className="w-full rounded-xl border border-white/15 bg-[#160B33] px-3.5 py-2.5 text-sm text-[#F7F5FC] placeholder-[#8E82B5] focus:border-[#26B9D1] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#C6BBE6] mb-1.5">
                  Keputusan Pengesahan Guru
                </label>
                <select
                  value={tv.overallStatus}
                  onChange={(e) =>
                    onUpdateTeacherValidation({
                      ...tv,
                      overallStatus: e.target.value as TeacherValidation['overallStatus'],
                      validatedAt: new Date().toISOString(),
                    })
                  }
                  className="w-full rounded-xl border border-white/15 bg-[#160B33] px-3.5 py-2.5 text-sm text-[#F7F5FC] focus:border-[#26B9D1] focus:outline-none"
                >
                  <option value="Belum Disahkan">Belum Disahkan</option>
                  <option value="Disahkan Mencapai Tahap">Disahkan Mencapai Tahap</option>
                  <option value="Perlu Bimbingan Lanjut">Perlu Bimbingan Lanjut</option>
                </select>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <label className="flex items-center gap-2.5 rounded-xl border border-white/10 bg-[#160B33] p-3.5 cursor-pointer text-xs font-semibold text-[#F7F5FC]">
                <input
                  type="checkbox"
                  checked={tv.o1Validated}
                  onChange={(e) =>
                    onUpdateTeacherValidation({
                      ...tv,
                      o1Validated: e.target.checked,
                      validatedAt: new Date().toISOString(),
                    })
                  }
                  className="h-4 w-4 accent-[#26B9D1]"
                />
                O1 Disahkan Guru (Kenal pasti ≥3/4 kriteria)
              </label>
              <label className="flex items-center gap-2.5 rounded-xl border border-white/10 bg-[#160B33] p-3.5 cursor-pointer text-xs font-semibold text-[#F7F5FC]">
                <input
                  type="checkbox"
                  checked={tv.o2Validated}
                  onChange={(e) =>
                    onUpdateTeacherValidation({
                      ...tv,
                      o2Validated: e.target.checked,
                      validatedAt: new Date().toISOString(),
                    })
                  }
                  className="h-4 w-4 accent-[#26B9D1]"
                />
                O2 Disahkan Guru (≥3/4 kriteria dalam ≥2/3 cubaan)
              </label>
              <label className="flex items-center gap-2.5 rounded-xl border border-white/10 bg-[#160B33] p-3.5 cursor-pointer text-xs font-semibold text-[#F7F5FC]">
                <input
                  type="checkbox"
                  checked={tv.o3Validated}
                  onChange={(e) =>
                    onUpdateTeacherValidation({
                      ...tv,
                      o3Validated: e.target.checked,
                      validatedAt: new Date().toISOString(),
                    })
                  }
                  className="h-4 w-4 accent-[#26B9D1]"
                />
                O3 Disahkan Guru (Pembetulan selepas maklum balas)
              </label>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#C6BBE6] mb-1.5">
                Catatan Pemerhatian Guru
              </label>
              <textarea
                rows={3}
                value={tv.teacherNotes}
                onChange={(e) =>
                  onUpdateTeacherValidation({ ...tv, teacherNotes: e.target.value })
                }
                placeholder="Catatkan ulasan pemerhatian guru terhadap lakuan larian pecut 30 meter murid..."
                className="w-full rounded-xl border border-white/15 bg-[#160B33] p-3.5 text-sm text-[#F7F5FC] placeholder-[#8E82B5] focus:border-[#26B9D1] focus:outline-none"
              />
            </div>

            {/* Mission Completion Checklist & TAMATKAN MISI Trigger */}
            <div className="no-print rounded-xl border border-white/15 bg-[#160B33] p-4 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-xs font-bold text-[#26B9D1]">
                  <Award className="h-4 w-4" />
                  <span>SYARAT PENAMATAN MISI MOD SEKOLAH</span>
                </div>
                <span className="text-xs text-[#C6BBE6]">
                  Status Semasa: <strong className="text-[#FFC94A]">{tv.overallStatus}</strong>
                </span>
              </div>

              <div className="grid gap-2 sm:grid-cols-2 text-xs">
                {[
                  {
                    label:
                      'Semua aktiviti wajib Mod Sekolah diselesaikan (Semakan O1 & Analisis Video O2)',
                    ok: missionStatus.requiredActivitiesDone,
                  },
                  {
                    label: 'Refleksi kendiri (O3) telah dilengkapkan',
                    ok: missionStatus.selfReflectionDone,
                  },
                  {
                    label: 'Guru telah mengesahkan O3 (Pembetulan selepas maklum balas)',
                    ok: missionStatus.o3TeacherValidated,
                  },
                  {
                    label: 'Status semasa menunjukkan "Disahkan Mencapai Tahap"',
                    ok: missionStatus.statusAchieved,
                  },
                ].map((req, idx) => (
                  <div
                    key={idx}
                    className={`flex items-center gap-2 rounded-lg border px-3 py-2 ${
                      req.ok
                        ? 'border-[#26B9D1]/35 bg-[#26B9D1]/10 text-[#F7F5FC]'
                        : 'border-white/10 bg-[#201146] text-[#C6BBE6]'
                    }`}
                  >
                    {req.ok ? (
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-[#26B9D1]" />
                    ) : (
                      <Circle className="h-4 w-4 shrink-0 text-[#8E82B5]" />
                    )}
                    <span>{req.label}</span>
                  </div>
                ))}
              </div>

              {missionStatus.canFinishMission ? (
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={onFinishMission}
                    className="cursor-pointer inline-flex w-full items-center justify-center gap-2.5 rounded-xl bg-[#FFC94A] px-6 py-4 text-sm sm:text-base font-extrabold text-[#14092E] hover:bg-[#ffd56e] transition-colors shadow-[0_0_25px_rgba(255,201,74,0.35)]"
                  >
                    <Trophy className="h-5 w-5" />
                    TAMATKAN MISI
                  </button>
                </div>
              ) : (
                <p className="text-[11px] text-[#C6BBE6]">
                  Butang <strong className="text-[#FFC94A]">TAMATKAN MISI</strong> akan dipaparkan apabila semua 4 syarat penyelesaian Mod Sekolah di atas dipenuhi.
                </p>
              )}
            </div>

            <div className="no-print flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-4">
              <div className="flex items-center gap-2 text-xs text-[#C6BBE6]">
                <ClipboardCheck className="h-4 w-4 text-[#26B9D1]" />
                <span>
                  Status Semasa: <strong className="text-[#FFC94A]">{tv.overallStatus}</strong>
                </span>
              </div>

              <button
                type="button"
                onClick={onRestartAll}
                className="cursor-pointer inline-flex items-center gap-1.5 rounded-xl border border-red-400/35 bg-red-500/10 px-4 py-2 text-xs font-semibold text-red-200 hover:bg-red-500/20"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Mula Semula Sesi Baharu
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
