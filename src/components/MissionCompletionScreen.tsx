import React from 'react';
import { motion } from 'motion/react';
import {
  Award,
  CheckCircle2,
  FileCheck2,
  Home,
  RotateCcw,
  Sparkles,
  Trophy,
} from 'lucide-react';
import { PupilPortfolio } from '../types/arena';
import { ASSETS, DETEKTIF_TEKNIK_CASES, HOME_QUIZ_QUESTIONS } from '../data/curriculumContent';

interface MissionCompletionScreenProps {
  portfolio: PupilPortfolio;
  onViewSummary: () => void;
  onBackToHome: () => void;
  onRequestRestart: () => void;
}

const CONFETTI_PARTICLES = [
  { left: '6%', delay: 0, duration: 4.6, color: '#FFC94A', size: 8 },
  { left: '14%', delay: 0.6, duration: 5.2, color: '#26B9D1', size: 7 },
  { left: '23%', delay: 0.2, duration: 4.3, color: '#B34BCB', size: 9 },
  { left: '34%', delay: 1.1, duration: 5.0, color: '#FFC94A', size: 6 },
  { left: '46%', delay: 0.4, duration: 4.8, color: '#26B9D1', size: 8 },
  { left: '58%', delay: 0.9, duration: 4.5, color: '#FFC94A', size: 7 },
  { left: '68%', delay: 0.1, duration: 5.1, color: '#26B9D1', size: 9 },
  { left: '78%', delay: 0.7, duration: 4.4, color: '#B34BCB', size: 7 },
  { left: '87%', delay: 0.3, duration: 4.9, color: '#FFC94A', size: 8 },
  { left: '94%', delay: 1.0, duration: 4.7, color: '#26B9D1', size: 6 },
];

export const MissionCompletionScreen: React.FC<MissionCompletionScreenProps> = ({
  portfolio,
  onViewSummary,
  onBackToHome,
  onRequestRestart,
}) => {
  const isHomeMode = portfolio.activeMode === 'home';

  const analyzedCount = portfolio.attempts.filter(
    (a) => a.completed || (a.frameAnalyses && a.frameAnalyses.length > 0)
  ).length;
  const schoolReflectionCount = portfolio.attempts.filter((a) =>
    Boolean(a.o3IdentifiedAspect?.trim())
  ).length;

  const quizCorrectCount = HOME_QUIZ_QUESTIONS.reduce(
    (acc, q) => (portfolio.homeQuizAnswers[q.id] === q.correctIndex ? acc + 1 : acc),
    0
  );

  return (
    <div className="relative overflow-hidden rounded-3xl border border-[#FFC94A]/40 bg-gradient-to-b from-[#241252] via-[#1B0E3B] to-[#14092E] p-6 sm:p-10 shadow-[0_0_60px_rgba(38,185,209,0.14)]">
      {/* Gentle futuristic confetti & ambient glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 overflow-hidden"
      >
        <div className="absolute -top-24 left-1/2 h-72 w-[36rem] -translate-x-1/2 rounded-full bg-[#26B9D1]/15 blur-3xl" />
        <div className="absolute bottom-0 left-1/4 h-64 w-64 rounded-full bg-[#7042C5]/25 blur-3xl" />
        <div className="absolute bottom-0 right-1/4 h-64 w-64 rounded-full bg-[#FFC94A]/10 blur-3xl" />

        {CONFETTI_PARTICLES.map((p, idx) => (
          <motion.span
            key={idx}
            initial={{ y: -20, opacity: 0, rotate: 0 }}
            animate={{
              y: [0, 420],
              opacity: [0, 0.85, 0.85, 0],
              rotate: [0, 180, 360],
            }}
            transition={{
              duration: p.duration,
              delay: p.delay,
              repeat: Infinity,
              ease: 'linear',
            }}
            style={{
              left: p.left,
              width: p.size,
              height: p.size * 1.4,
              backgroundColor: p.color,
            }}
            className="absolute top-0 rounded-sm opacity-75"
          />
        ))}
      </div>

      <div className="relative z-10 space-y-8">
        {/* Hero Celebration Header */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="text-center space-y-3 max-w-3xl mx-auto"
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-[#FFC94A]/45 bg-[#FFC94A]/15 px-4 py-1.5 text-xs font-extrabold tracking-wide text-[#FFC94A]">
            <Trophy className="h-4 w-4" />
            <span>
              {isHomeMode
                ? 'BERJAYA MENYELESAIKAN MISI PEMBELAJARAN KENDIRI'
                : 'PENGESAHAN RASMI · DISAHKAN MENCAPAI TAHAP'}
            </span>
          </div>

          <h1 className="font-display text-3xl sm:text-5xl font-extrabold tracking-tight text-[#F7F5FC] drop-shadow-[0_4px_20px_rgba(38,185,209,0.25)]">
            TAHNIAH, <span className="text-[#FFC94A]">EJEN PECUT!</span>
          </h1>

          <p className="text-base sm:text-lg font-semibold text-[#26B9D1]">
            Kamu telah berjaya menyelesaikan misi Arena Pecut 30 Meter!
          </p>

          <p className="text-xs sm:text-sm text-[#D5CCE8]">
            Ejen:{' '}
            <strong className="text-[#F7F5FC]">
              {portfolio.pupilName || 'Murid Tahun 5'}
            </strong>{' '}
            · Kelas:{' '}
            <strong className="text-[#F7F5FC]">
              {portfolio.pupilClass || 'Tahun 5'}
            </strong>{' '}
            ·{' '}
            {isHomeMode ? (
              <>
                Mod:{' '}
                <strong className="text-[#FFC94A]">
                  Mod Rumah (Pembelajaran Kendiri)
                </strong>
              </>
            ) : (
              <>
                Disahkan oleh:{' '}
                <strong className="text-[#FFC94A]">
                  {portfolio.teacherValidation.teacherName ||
                    'Guru Pendidikan Jasmani'}
                </strong>
              </>
            )}
          </p>
        </motion.div>

        {/* Center Stage: Official Characters Arif & Aya Together + Individual Dialog Boxes */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="rounded-2xl border border-white/15 bg-[#160B33]/85 p-5 sm:p-7 backdrop-blur-sm space-y-6"
        >
          {/* Paired Center Character Showcase */}
          <div className="relative mx-auto max-w-3xl rounded-2xl border border-[#26B9D1]/30 bg-gradient-to-b from-[#3A217A]/50 via-[#22124A]/70 to-[#160B33] px-4 pt-6 pb-2 overflow-hidden">
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-[#26B9D1]/15 to-transparent" />
            <div className="relative flex items-end justify-center gap-4 sm:gap-10">
              <div className="flex flex-col items-center">
                <img
                  src={ASSETS.arifFull}
                  alt="Arif — Ejen Kemahiran meraikan kejayaan"
                  referrerPolicy="no-referrer"
                  className="h-56 sm:h-72 w-auto object-contain object-bottom drop-shadow-[0_14px_24px_rgba(38,185,209,0.28)]"
                />
              </div>
              <div className="flex flex-col items-center">
                <img
                  src={ASSETS.ayaFull}
                  alt="Aya — Ejen Analisis meraikan kejayaan"
                  referrerPolicy="no-referrer"
                  className="h-56 sm:h-72 w-auto object-contain object-bottom drop-shadow-[0_14px_24px_rgba(255,201,74,0.25)]"
                />
              </div>
            </div>
          </div>

          {/* Dedicated Dialog Boxes for Arif and Aya */}
          <div className="grid gap-5 md:grid-cols-2">
            {/* Arif Dialog */}
            <div className="rounded-2xl border border-[#26B9D1]/40 bg-[#201146] p-5 space-y-3 shadow-lg">
              <div className="flex items-center gap-3">
                <div className="h-12 w-11 shrink-0 overflow-hidden rounded-lg border border-[#26B9D1]/50 bg-[#281653] pt-0.5">
                  <img
                    src={ASSETS.arifPortrait}
                    alt="Arif — Ejen Kemahiran"
                    referrerPolicy="no-referrer"
                    className="h-full w-full object-contain object-top"
                  />
                </div>
                <div>
                  <div className="text-xs font-extrabold tracking-wide text-[#26B9D1]">
                    ARIF — EJEN KEMAHIRAN
                  </div>
                  <div className="text-[11px] text-[#C6BBE6]">Mesej Penutup Rasmi</div>
                </div>
              </div>
              <p className="text-sm leading-relaxed text-[#F7F5FC]">
                “Tahniah, Ejen Pecut! Kamu telah menyelesaikan misi Arena Pecut 30 Meter dengan baik. Kamu telah berusaha mengenal pasti teknik yang betul dan memperbaiki lakuan kamu. Teruskan berlatih dan jangan mudah berputus asa!”
              </p>
            </div>

            {/* Aya Dialog */}
            <div className="rounded-2xl border border-[#FFC94A]/40 bg-[#201146] p-5 space-y-3 shadow-lg">
              <div className="flex items-center gap-3">
                <div className="h-12 w-11 shrink-0 overflow-hidden rounded-lg border border-[#FFC94A]/50 bg-[#281653] pt-0.5">
                  <img
                    src={ASSETS.ayaPortrait}
                    alt="Aya — Ejen Analisis"
                    referrerPolicy="no-referrer"
                    className="h-full w-full object-contain object-top"
                  />
                </div>
                <div>
                  <div className="text-xs font-extrabold tracking-wide text-[#FFC94A]">
                    AYA — EJEN ANALISIS
                  </div>
                  <div className="text-[11px] text-[#C6BBE6]">Mesej Penutup Rasmi</div>
                </div>
              </div>
              <p className="text-sm leading-relaxed text-[#F7F5FC]">
                “Syabas! Kamu telah menunjukkan usaha untuk mengenal pasti teknik, menilai pergerakan dan memperbaiki lakuan. Ingat, kejayaan bukan sekadar berlari pantas, tetapi melakukan pergerakan dengan teknik yang betul dan selamat. Teruskan menjadi Ejen Pecut yang hebat!”
              </p>
            </div>
          </div>
        </motion.div>

        {/* Verified Achievement Summary Strip */}
        {isHomeMode ? (
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="flex items-center gap-3 rounded-xl border border-white/15 bg-[#201146]/90 p-4">
              <CheckCircle2 className="h-5 w-5 shrink-0 text-[#26B9D1]" />
              <div className="text-xs">
                <div className="font-bold text-[#F7F5FC]">Simulasi & Detektif Teknik</div>
                <div className="text-[#C6BBE6]">
                  K1–K4 Diteliti · Skor Detektif {portfolio.detectiveScore}/{DETEKTIF_TEKNIK_CASES.length}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-xl border border-white/15 bg-[#201146]/90 p-4">
              <Sparkles className="h-5 w-5 shrink-0 text-[#FFC94A]" />
              <div className="text-xs">
                <div className="font-bold text-[#F7F5FC]">Pergerakan Selamat & Kuiz O1</div>
                <div className="text-[#C6BBE6]">
                  Pergerakan Selesai · Kuiz {quizCorrectCount}/{HOME_QUIZ_QUESTIONS.length}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-xl border border-white/15 bg-[#201146]/90 p-4">
              <Award className="h-5 w-5 shrink-0 text-[#26B9D1]" />
              <div className="text-xs">
                <div className="font-bold text-[#F7F5FC]">Status Pembelajaran Kendiri</div>
                <div className="text-[#26B9D1] font-semibold">
                  BERJAYA MENYELESAIKAN MISI PEMBELAJARAN KENDIRI
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="flex items-center gap-3 rounded-xl border border-white/15 bg-[#201146]/90 p-4">
              <CheckCircle2 className="h-5 w-5 shrink-0 text-[#26B9D1]" />
              <div className="text-xs">
                <div className="font-bold text-[#F7F5FC]">Aktiviti & Analisis Video</div>
                <div className="text-[#C6BBE6]">
                  {analyzedCount} percubaan direkodkan
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-xl border border-white/15 bg-[#201146]/90 p-4">
              <Sparkles className="h-5 w-5 shrink-0 text-[#FFC94A]" />
              <div className="text-xs">
                <div className="font-bold text-[#F7F5FC]">Refleksi Kendiri (O3)</div>
                <div className="text-[#C6BBE6]">
                  {schoolReflectionCount} catatan refleksi disimpan
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-xl border border-white/15 bg-[#201146]/90 p-4">
              <Award className="h-5 w-5 shrink-0 text-[#26B9D1]" />
              <div className="text-xs">
                <div className="font-bold text-[#F7F5FC]">Pengesahan Guru PJ</div>
                <div className="text-[#FFC94A] font-semibold">
                  {portfolio.teacherValidation.overallStatus}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Closing Slogan Banner */}
        <div className="rounded-2xl border border-[#FFC94A]/35 bg-gradient-to-r from-[#7042C5]/40 via-[#281653] to-[#26B9D1]/20 px-6 py-5 text-center space-y-1.5">
          <p className="font-display text-lg sm:text-2xl font-extrabold tracking-wide text-[#FFC94A]">
            BERSAMA MENEROKA, BERSAMA MENGUASAI!
          </p>
          <p className="text-sm sm:text-base font-bold text-[#F7F5FC]">
            Misi Selesai. Teruskan Mencipta Kejayaan!
          </p>
        </div>

        {/* Post-Completion Action Buttons */}
        <div className="flex flex-col sm:flex-row flex-wrap items-center justify-center gap-3 pt-2">
          <button
            type="button"
            onClick={onViewSummary}
            className="cursor-pointer inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-[#26B9D1] px-6 py-3.5 text-sm font-extrabold text-[#14092E] hover:bg-[#49CFE3] transition-colors shadow-lg"
          >
            <FileCheck2 className="h-4 w-4" />
            LIHAT RINGKASAN PENCAPAIAN
          </button>

          <button
            type="button"
            onClick={onBackToHome}
            className="cursor-pointer inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-[#FFC94A] px-6 py-3.5 text-sm font-extrabold text-[#14092E] hover:bg-[#ffd56e] transition-colors shadow-lg"
          >
            <Home className="h-4 w-4" />
            KEMBALI KE PUSAT OPERASI
          </button>

          <button
            type="button"
            onClick={onRequestRestart}
            className="cursor-pointer inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/5 px-5 py-3.5 text-xs font-semibold text-[#E5DDF5] hover:bg-white/10 transition-colors"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Mula Semula Sesi Baharu
          </button>
        </div>
      </div>
    </div>
  );
};
