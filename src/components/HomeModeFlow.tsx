import React, { useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  ShieldCheck,
  RotateCcw,
  Search,
  Trophy,
} from 'lucide-react';
import { CriterionCode, HomeStation, PupilPortfolio } from '../types/arena';
import {
  ASSETS,
  DETEKTIF_TEKNIK_CASES,
  HOME_QUIZ_QUESTIONS,
  HOME_SAFETY_RULES,
} from '../data/curriculumContent';
import { SprintSimulator } from './SprintSimulator';
import { getMissionCompletionStatus } from './EvidenceTeacherView';

interface HomeModeFlowProps {
  portfolio: PupilPortfolio;
  onUpdatePortfolio: (updater: (prev: PupilPortfolio) => PupilPortfolio) => void;
  onBackToModes: () => void;
  onGoToRecords: () => void;
  onFinishMission: () => void;
}

export const HomeModeFlow: React.FC<HomeModeFlowProps> = ({
  portfolio,
  onUpdatePortfolio,
  onBackToModes,
  onGoToRecords,
  onFinishMission,
}) => {
  const [station, setStation] = useState<HomeStation>('keselamatan');
  const [selectedCriterion, setSelectedCriterion] = useState<CriterionCode>('K1');

  // Detektif Teknik state
  const [detectiveAnswers, setDetectiveAnswers] = useState<Record<string, number>>({});
  const [detectiveSubmitted, setDetectiveSubmitted] = useState(portfolio.detectiveCompleted);

  const homeCompletion = getMissionCompletionStatus(portfolio, 'home');

  const stations: Array<{ id: HomeStation; label: string }> = [
    { id: 'keselamatan', label: '1. Keselamatan' },
    { id: 'simulasi', label: '2. Simulasi K1–K4' },
    { id: 'detektif', label: '3. Detektif Teknik' },
    { id: 'kuiz', label: '4. Kuiz (O1)' },
    { id: 'refleksi', label: '5. Refleksi Kendiri' },
  ];

  const handleSubmitDetective = () => {
    const score = DETEKTIF_TEKNIK_CASES.reduce(
      (acc, item) => (detectiveAnswers[item.id] === item.correctIndex ? acc + 1 : acc),
      0
    );
    setDetectiveSubmitted(true);
    onUpdatePortfolio((prev) => ({
      ...prev,
      detectiveCompleted: true,
      detectiveScore: Math.max(prev.detectiveScore, score),
    }));
  };

  const handleResetDetective = () => {
    setDetectiveAnswers({});
    setDetectiveSubmitted(false);
  };

  const handleSelectAnswer = (qId: string, optionIdx: number) => {
    if (portfolio.homeQuizSubmitted) return;
    onUpdatePortfolio((prev) => ({
      ...prev,
      homeQuizAnswers: {
        ...prev.homeQuizAnswers,
        [qId]: optionIdx,
      },
    }));
  };

  const handleSubmitQuiz = () => {
    onUpdatePortfolio((prev) => ({
      ...prev,
      homeQuizSubmitted: true,
    }));
  };

  const handleResetQuiz = () => {
    onUpdatePortfolio((prev) => ({
      ...prev,
      homeQuizAnswers: {},
      homeQuizSubmitted: false,
    }));
  };

  const quizScore = HOME_QUIZ_QUESTIONS.reduce(
    (acc, q) =>
      portfolio.homeQuizAnswers[q.id] === q.correctIndex ? acc + 1 : acc,
    0
  );

  const detectiveCurrentScore = DETEKTIF_TEKNIK_CASES.reduce(
    (acc, item) => (detectiveAnswers[item.id] === item.correctIndex ? acc + 1 : acc),
    0
  );

  return (
    <div className="space-y-6">
      {/* Header & Station Navigation */}
      <div className="rounded-2xl border border-white/15 bg-[#201146] p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
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
              MOD RUMAH · Penerokaan Teknik & Simulasi
            </h1>
          </div>

          <div className="flex flex-wrap gap-1.5 rounded-xl bg-[#160B33] p-1 border border-white/10">
            {stations.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setStation(s.id)}
                className={`cursor-pointer whitespace-nowrap rounded-lg px-3 py-2 text-xs font-semibold transition-colors ${
                  station === s.id
                    ? 'bg-[#FFC94A] text-[#14092E]'
                    : 'text-[#C6BBE6] hover:text-white'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* STATION 1: KESELAMATAN DI RUMAH */}
      {station === 'keselamatan' && (
        <div className="grid gap-6 lg:grid-cols-12 items-stretch">
          <div className="lg:col-span-7 rounded-2xl border border-white/15 bg-[#201146] p-6 space-y-5">
            <div className="flex items-center gap-2.5">
              <ShieldCheck className="h-6 w-6 text-[#26B9D1]" />
              <h2 className="font-display text-xl font-bold text-[#F7F5FC]">
                Panduan Keselamatan & Latihan Ringan Di Rumah
              </h2>
            </div>

            <ul className="space-y-3 text-sm text-[#E5DDF5]">
              {HOME_SAFETY_RULES.map((rule, idx) => (
                <li
                  key={idx}
                  className="flex items-start gap-3 rounded-xl border border-white/10 bg-[#160B33] p-3.5"
                >
                  <span className="font-mono-data text-xs font-bold text-[#FFC94A] mt-0.5">
                    0{idx + 1}.
                  </span>
                  <span>{rule}</span>
                </li>
              ))}
            </ul>

            <label className="flex items-center gap-3 rounded-xl border border-[#26B9D1]/30 bg-[#26B9D1]/10 p-4 cursor-pointer">
              <input
                type="checkbox"
                checked={portfolio.homeSafetyChecked}
                onChange={(e) =>
                  onUpdatePortfolio((prev) => ({
                    ...prev,
                    homeSafetyChecked: e.target.checked,
                  }))
                }
                className="h-5 w-5 accent-[#26B9D1]"
              />
              <span className="text-sm font-semibold text-[#F7F5FC]">
                Saya telah memastikan ruang di rumah selamat dan bersedia belajar teknik larian pecut.
              </span>
            </label>

            <button
              type="button"
              onClick={() => setStation('simulasi')}
              className="cursor-pointer inline-flex items-center gap-2 rounded-xl bg-[#FFC94A] px-5 py-3 text-sm font-extrabold text-[#14092E] hover:bg-[#ffd56e]"
            >
              Terus ke Makmal Simulasi K1–K4
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>

          <div className="lg:col-span-5 flex flex-col justify-between rounded-2xl border border-white/15 bg-[#201146] p-6 space-y-4">
            <div>
              <img
                src={ASSETS.homeTrack}
                alt="Zon latihan teknik di rumah"
                referrerPolicy="no-referrer"
                className="aspect-video w-full rounded-xl object-cover border border-white/10"
              />
              <h3 className="font-display mt-4 text-lg font-bold text-[#F7F5FC]">
                Latihan Statik Tanpa Ruang Luas
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-[#D5CCE8]">
                Di rumah, kamu boleh melatih ayunan tangan K2 di hadapan cermin selama 20 saat, serta latihan angkatan lutut statik (K3) secara terkawal sebelum mengaplikasikannya di trek 30 meter sekolah.
              </p>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-[#160B33] p-3.5">
                <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg border border-[#26B9D1]/40 bg-[#281653] pt-1">
                  <img
                    src={ASSETS.arifPortrait}
                    alt="Arif Ejen Kemahiran"
                    referrerPolicy="no-referrer"
                    className="h-full w-full object-contain object-top"
                  />
                </div>
                <p className="text-xs text-[#E5DDF5]">
                  <strong className="text-[#26B9D1]">Arif:</strong> “Utamakan keselamatan dahulu! Latihan teknik perlahan di rumah membantu kamu lebih yakin semasa sesi padang.”
                </p>
              </div>
              <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-[#160B33] p-3.5">
                <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg border border-[#FFC94A]/40 bg-[#281653] pt-1">
                  <img
                    src={ASSETS.ayaPortrait}
                    alt="Aya Ejen Analisis"
                    referrerPolicy="no-referrer"
                    className="h-full w-full object-contain object-top"
                  />
                </div>
                <p className="text-xs text-[#E5DDF5]">
                  <strong className="text-[#FFC94A]">Aya:</strong> “Selepas ini, mari lihat demonstrasi K1–K4 dan selesaikan misi Detektif Teknik!”
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* STATION 2: SIMULASI K1-K4 */}
      {station === 'simulasi' && (
        <div className="space-y-6">
          <SprintSimulator
            selectedCriterion={selectedCriterion}
            onSelectCriterion={(code) => {
              setSelectedCriterion(code);
              if (!portfolio.homeDemoCompleted) {
                onUpdatePortfolio((prev) => ({
                  ...prev,
                  homeDemoCompleted: true,
                }));
              }
            }}
          />

          <label className="flex items-center gap-3 rounded-xl border border-[#26B9D1]/35 bg-[#201146] p-4 cursor-pointer">
            <input
              type="checkbox"
              checked={portfolio.homeDemoCompleted}
              onChange={(e) =>
                onUpdatePortfolio((prev) => ({
                  ...prev,
                  homeDemoCompleted: e.target.checked,
                }))
              }
              className="h-5 w-5 accent-[#26B9D1]"
            />
            <span className="text-sm font-semibold text-[#F7F5FC]">
              Saya telah menonton dan meneliti demonstrasi teknik K1–K4 di atas.
            </span>
          </label>

          <div className="flex flex-wrap justify-between gap-3">
            <button
              type="button"
              onClick={() => setStation('keselamatan')}
              className="cursor-pointer inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-xs font-semibold text-[#F7F5FC] hover:bg-white/10"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Kembali ke Keselamatan
            </button>
            <button
              type="button"
              onClick={() => {
                if (!portfolio.homeDemoCompleted) {
                  onUpdatePortfolio((prev) => ({
                    ...prev,
                    homeDemoCompleted: true,
                  }));
                }
                setStation('detektif');
              }}
              className="cursor-pointer inline-flex items-center gap-2 rounded-xl bg-[#FFC94A] px-5 py-3 text-sm font-extrabold text-[#14092E] hover:bg-[#ffd56e]"
            >
              Terus ke Detektif Teknik
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* STATION 3: DETEKTIF TEKNIK & CABARAN PERGERAKAN SELAMAT */}
      {station === 'detektif' && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-white/15 bg-[#201146] p-6 space-y-5">
            <div className="flex flex-wrap items-start justify-between gap-4 border-b border-white/10 pb-4">
              <div>
                <div className="inline-flex items-center gap-2 text-xs font-bold text-[#26B9D1]">
                  <Search className="h-4 w-4" />
                  <span>STESEN 3 · AKTIVITI DETEKTIF TEKNIK</span>
                </div>
                <h2 className="font-display mt-1 text-xl sm:text-2xl font-bold text-[#F7F5FC]">
                  Kenal Pasti Kesalahan & Pembetulan Teknik K1–K4
                </h2>
                <p className="mt-1 text-sm text-[#C6BBE6]">
                  Bantu Ejen Aya dan Ejen Arif menyelesaikan 4 kes kesilapan teknik di trek.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-14 w-12 overflow-hidden rounded-lg border border-[#26B9D1]/40 bg-[#160B33] pt-0.5">
                  <img
                    src={ASSETS.ayaPortrait}
                    alt="Aya Detektif"
                    referrerPolicy="no-referrer"
                    className="h-full w-full object-contain object-top"
                  />
                </div>
                <div className="h-14 w-12 overflow-hidden rounded-lg border border-[#FFC94A]/40 bg-[#160B33] pt-0.5">
                  <img
                    src={ASSETS.arifPortrait}
                    alt="Arif Detektif"
                    referrerPolicy="no-referrer"
                    className="h-full w-full object-contain object-top"
                  />
                </div>
              </div>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              {DETEKTIF_TEKNIK_CASES.map((item) => {
                const chosen = detectiveAnswers[item.id];
                const isCorrect = chosen === item.correctIndex;
                return (
                  <div
                    key={item.id}
                    className="rounded-xl border border-white/15 bg-[#160B33] p-5 space-y-3"
                  >
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="text-[#FFC94A]">{item.title}</span>
                      <span className="rounded-md bg-[#281653] px-2 py-0.5 text-[#26B9D1]">
                        Fokus {item.focusCriterion}
                      </span>
                    </div>
                    <p className="text-xs leading-relaxed text-[#D5CCE8]">
                      <strong className="text-[#F7F5FC]">Petunjuk: </strong>
                      {item.clue}
                    </p>
                    <h3 className="text-sm font-bold text-[#F7F5FC]">{item.question}</h3>

                    <div className="space-y-2">
                      {item.options.map((opt, optIdx) => {
                        const selected = chosen === optIdx;
                        let style =
                          'border-white/15 bg-[#201146] text-[#E5DDF5] hover:border-[#26B9D1]/60';
                        if (detectiveSubmitted) {
                          if (optIdx === item.correctIndex) {
                            style = 'border-[#26B9D1] bg-[#26B9D1]/15 text-[#F7F5FC] font-semibold';
                          } else if (selected) {
                            style = 'border-red-400 bg-red-500/15 text-red-100';
                          }
                        } else if (selected) {
                          style = 'border-[#FFC94A] bg-[#FFC94A]/15 text-[#FFC94A] font-semibold';
                        }
                        return (
                          <button
                            key={optIdx}
                            type="button"
                            onClick={() => {
                              if (!detectiveSubmitted) {
                                setDetectiveAnswers((prev) => ({ ...prev, [item.id]: optIdx }));
                              }
                            }}
                            className={`cursor-pointer w-full rounded-xl border px-3.5 py-2.5 text-left text-xs transition-colors ${style}`}
                          >
                            {opt}
                          </button>
                        );
                      })}
                    </div>

                    {detectiveSubmitted && (
                      <div className="mt-3 rounded-xl border border-white/10 bg-[#281653] p-3 text-xs space-y-1.5">
                        <div
                          className={`font-bold flex items-center gap-1.5 ${
                            isCorrect ? 'text-[#26B9D1]' : 'text-[#FFC94A]'
                          }`}
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          {isCorrect ? 'Kes Diselesaikan!' : 'Semak Pembetulan Aya:'}
                        </div>
                        <p className="text-[#E5DDF5]">{item.feedbackAya}</p>
                        <p className="text-[#FFE8A3]">
                          <strong>Tip Arif:</strong> {item.correctionArif}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-4">
              {detectiveSubmitted ? (
                <div className="text-sm font-bold text-[#F7F5FC]">
                  Skor Detektif Teknik:{' '}
                  <span className="font-mono-data text-[#FFC94A]">
                    {detectiveCurrentScore > 0 ? detectiveCurrentScore : portfolio.detectiveScore} / {DETEKTIF_TEKNIK_CASES.length}
                  </span>
                </div>
              ) : (
                <div className="text-xs text-[#C6BBE6]">
                  Diselesaikan: {Object.keys(detectiveAnswers).length} / {DETEKTIF_TEKNIK_CASES.length} kes
                </div>
              )}

              <div className="flex flex-wrap gap-2">
                {!detectiveSubmitted ? (
                  <button
                    type="button"
                    disabled={Object.keys(detectiveAnswers).length < DETEKTIF_TEKNIK_CASES.length}
                    onClick={handleSubmitDetective}
                    className="cursor-pointer rounded-xl bg-[#26B9D1] px-5 py-2.5 text-xs font-extrabold text-[#14092E] hover:bg-[#49CFE3] disabled:opacity-40"
                  >
                    Semak Kes Detektif Teknik
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleResetDetective}
                    className="cursor-pointer inline-flex items-center gap-1.5 rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-xs font-semibold text-[#F7F5FC] hover:bg-white/10"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    Ulang Kes Detektif
                  </button>
                )}
              </div>
            </div>

            {/* Cabaran Pergerakan Selamat (Wajib Mod Rumah) */}
            <div className="rounded-xl border border-[#26B9D1]/35 bg-[#160B33] p-5 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="font-display text-base font-bold text-[#F7F5FC]">
                  Cabaran Pergerakan Selamat Di Rumah (Wajib)
                </h3>
                <span className="rounded-md bg-[#26B9D1]/15 border border-[#26B9D1]/40 px-2 py-0.5 text-[11px] font-bold text-[#26B9D1]">
                  Aktiviti Pergerakan Bayangan
                </span>
              </div>
              <p className="text-xs leading-relaxed text-[#D5CCE8]">
                Jika ruang rumah lapang dan lantai tidak licin, lakukan ayunan tangan K2 secara statik selama 15 saat dan angkatan lutut perlahan K3 selama 10 saat dengan postur kepala memandang ke hadapan (K1).
              </p>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={portfolio.safeChallengeDone}
                  onChange={(e) =>
                    onUpdatePortfolio((prev) => ({
                      ...prev,
                      safeChallengeDone: e.target.checked,
                    }))
                  }
                  className="h-5 w-5 accent-[#26B9D1]"
                />
                <span className="text-xs font-semibold text-[#F7F5FC]">
                  Saya telah mencuba latihan pergerakan selamat di tempat yang sesuai (atau meneliti demonstrasi dengan teliti jika ruang terhad).
                </span>
              </label>
            </div>

            <div className="flex flex-wrap justify-between gap-3">
              <button
                type="button"
                onClick={() => setStation('simulasi')}
                className="cursor-pointer inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-xs font-semibold text-[#F7F5FC] hover:bg-white/10"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Kembali ke Simulasi
              </button>
              <button
                type="button"
                onClick={() => setStation('kuiz')}
                className="cursor-pointer inline-flex items-center gap-2 rounded-xl bg-[#FFC94A] px-5 py-3 text-sm font-extrabold text-[#14092E] hover:bg-[#ffd56e]"
              >
                Terus ke Kuiz Pemerhatian (O1)
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STATION 4: KUIZ PEMERHATIAN O1 */}
      {station === 'kuiz' && (
        <div className="rounded-2xl border border-white/15 bg-[#201146] p-6 space-y-6">
          <div className="flex flex-wrap items-start justify-between gap-4 border-b border-white/10 pb-4">
            <div>
              <h2 className="font-display text-xl font-bold text-[#F7F5FC]">
                Cabaran Pemerhatian & Kuiz Teknik K1–K4 (Objektif O1)
              </h2>
              <p className="mt-1 text-sm text-[#C6BBE6]">
                Jawab semua 6 soalan pemerhatian untuk menguji pemahaman kamu terhadap 4 kriteria teknik larian pecut yang betul.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-12 w-10 overflow-hidden rounded-lg border border-[#26B9D1]/40 bg-[#160B33] pt-0.5">
                <img
                  src={ASSETS.ayaPortrait}
                  alt="Aya Kuiz"
                  referrerPolicy="no-referrer"
                  className="h-full w-full object-contain object-top"
                />
              </div>
              <div className="h-12 w-10 overflow-hidden rounded-lg border border-[#FFC94A]/40 bg-[#160B33] pt-0.5">
                <img
                  src={ASSETS.arifPortrait}
                  alt="Arif Kuiz"
                  referrerPolicy="no-referrer"
                  className="h-full w-full object-contain object-top"
                />
              </div>
            </div>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            {HOME_QUIZ_QUESTIONS.map((q, qIdx) => {
              const chosen = portfolio.homeQuizAnswers[q.id];
              const isCorrect = chosen === q.correctIndex;
              return (
                <div
                  key={q.id}
                  className="rounded-xl border border-white/15 bg-[#160B33] p-5 space-y-3"
                >
                  <div className="flex items-center justify-between text-xs text-[#26B9D1] font-bold">
                    <span>Soalan {qIdx + 1} · Kriteria {q.criterion}</span>
                  </div>
                  <p className="text-xs italic text-[#C6BBE6]">{q.scenario}</p>
                  <h3 className="text-sm font-bold text-[#F7F5FC]">{q.prompt}</h3>

                  <div className="space-y-2 pt-1">
                    {q.options.map((opt, optIdx) => {
                      const selected = chosen === optIdx;
                      let btnStyle =
                        'border-white/15 bg-[#201146] text-[#E5DDF5] hover:border-[#26B9D1]/60';
                      if (portfolio.homeQuizSubmitted) {
                        if (optIdx === q.correctIndex) {
                          btnStyle =
                            'border-[#26B9D1] bg-[#26B9D1]/15 text-[#F7F5FC] font-semibold';
                        } else if (selected && optIdx !== q.correctIndex) {
                          btnStyle =
                            'border-red-400 bg-red-500/15 text-red-100';
                        }
                      } else if (selected) {
                        btnStyle =
                          'border-[#FFC94A] bg-[#FFC94A]/15 text-[#FFC94A] font-semibold';
                      }

                      return (
                        <button
                          key={optIdx}
                          type="button"
                          onClick={() => handleSelectAnswer(q.id, optIdx)}
                          className={`cursor-pointer w-full rounded-xl border px-3.5 py-2.5 text-left text-xs transition-colors ${btnStyle}`}
                        >
                          {opt}
                        </button>
                      );
                    })}
                  </div>

                  {portfolio.homeQuizSubmitted && (
                    <div className="mt-3 rounded-xl border border-white/10 bg-[#281653] p-3 text-xs space-y-1.5">
                      <div
                        className={`font-bold flex items-center gap-1.5 ${
                          isCorrect ? 'text-[#26B9D1]' : 'text-[#FFC94A]'
                        }`}
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        {isCorrect ? 'Jawapan Tepat!' : 'Semak Semula Penjelasan Aya:'}
                      </div>
                      <p className="text-[#E5DDF5]">{q.explanationAya}</p>
                      <p className="text-[#FFE8A3]">
                        <strong>Tip Arif:</strong> {q.tipArif}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 border-t border-white/10 pt-4">
            {portfolio.homeQuizSubmitted ? (
              <div className="text-sm font-bold text-[#F7F5FC]">
                Keputusan Pemerhatian O1:{' '}
                <span className="font-mono-data text-[#FFC94A]">
                  {quizScore} / {HOME_QUIZ_QUESTIONS.length}
                </span>{' '}
                jawapan tepat
              </div>
            ) : (
              <div className="text-xs text-[#C6BBE6]">
                Dijawab: {Object.keys(portfolio.homeQuizAnswers).length} /{' '}
                {HOME_QUIZ_QUESTIONS.length} soalan
              </div>
            )}

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setStation('detektif')}
                className="cursor-pointer inline-flex items-center gap-1.5 rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-xs font-semibold text-[#F7F5FC] hover:bg-white/10"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Kembali ke Detektif
              </button>
              {!portfolio.homeQuizSubmitted ? (
                <button
                  type="button"
                  onClick={handleSubmitQuiz}
                  disabled={
                    Object.keys(portfolio.homeQuizAnswers).length <
                    HOME_QUIZ_QUESTIONS.length
                  }
                  className="cursor-pointer rounded-xl bg-[#26B9D1] px-5 py-2.5 text-xs font-extrabold text-[#14092E] hover:bg-[#49CFE3] disabled:opacity-40"
                >
                  Semak Jawapan Kuiz
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={handleResetQuiz}
                    className="cursor-pointer inline-flex items-center gap-1.5 rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-xs font-semibold text-[#F7F5FC] hover:bg-white/10"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    Cuba Kuiz Semula
                  </button>
                  <button
                    type="button"
                    onClick={() => setStation('refleksi')}
                    className="cursor-pointer inline-flex items-center gap-2 rounded-xl bg-[#FFC94A] px-5 py-2.5 text-xs font-extrabold text-[#14092E] hover:bg-[#ffd56e]"
                  >
                    Terus ke Refleksi Kendiri
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* STATION 5: REFLEKSI KENDIRI & STATUS PENYELESAIAN */}
      {station === 'refleksi' && (
        <div className="rounded-2xl border border-white/15 bg-[#201146] p-6 space-y-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="font-display text-xl font-bold text-[#F7F5FC]">
                Refleksi Kendiri Mod Rumah & Status Penyelesaian
              </h2>
              <p className="mt-1 text-sm text-[#D5CCE8]">
                Tuliskan satu teknik larian pecut (K1–K4) yang paling kamu kuasai hari ini dan satu perkara yang ingin kamu fokuskan semasa larian 30 meter di sekolah nanti.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-14 w-12 overflow-hidden rounded-lg border border-[#26B9D1]/40 bg-[#160B33] pt-0.5">
                <img
                  src={ASSETS.arifPortrait}
                  alt="Arif Refleksi"
                  referrerPolicy="no-referrer"
                  className="h-full w-full object-contain object-top"
                />
              </div>
              <div className="h-14 w-12 overflow-hidden rounded-lg border border-[#FFC94A]/40 bg-[#160B33] pt-0.5">
                <img
                  src={ASSETS.ayaPortrait}
                  alt="Aya Refleksi"
                  referrerPolicy="no-referrer"
                  className="h-full w-full object-contain object-top"
                />
              </div>
            </div>
          </div>

          {/* Status Penyelesaian Aktiviti Mod Rumah */}
          <div className="grid gap-3 sm:grid-cols-5">
            <div className="rounded-xl border border-white/10 bg-[#160B33] p-3.5 text-xs">
              <div className="text-[#C6BBE6]">Demonstrasi K1–K4</div>
              <div
                className={`mt-1 font-bold ${
                  portfolio.homeDemoCompleted ? 'text-[#26B9D1]' : 'text-[#FFC94A]'
                }`}
              >
                {portfolio.homeDemoCompleted ? 'Telah diteliti' : 'Belum selesai'}
              </div>
            </div>
            <div className="rounded-xl border border-white/10 bg-[#160B33] p-3.5 text-xs">
              <div className="text-[#C6BBE6]">Detektif Teknik</div>
              <div
                className={`mt-1 font-bold ${
                  portfolio.detectiveCompleted ? 'text-[#26B9D1]' : 'text-[#FFC94A]'
                }`}
              >
                {portfolio.detectiveCompleted
                  ? `Selesai (${portfolio.detectiveScore}/${DETEKTIF_TEKNIK_CASES.length})`
                  : 'Belum selesai'}
              </div>
            </div>
            <div className="rounded-xl border border-white/10 bg-[#160B33] p-3.5 text-xs">
              <div className="text-[#C6BBE6]">Pergerakan Selamat</div>
              <div
                className={`mt-1 font-bold ${
                  portfolio.safeChallengeDone ? 'text-[#26B9D1]' : 'text-[#FFC94A]'
                }`}
              >
                {portfolio.safeChallengeDone ? 'Dilengkapkan' : 'Belum ditanda'}
              </div>
            </div>
            <div className="rounded-xl border border-white/10 bg-[#160B33] p-3.5 text-xs">
              <div className="text-[#C6BBE6]">Kuiz Pemerhatian O1</div>
              <div
                className={`mt-1 font-bold ${
                  portfolio.homeQuizSubmitted ? 'text-[#26B9D1]' : 'text-[#FFC94A]'
                }`}
              >
                {portfolio.homeQuizSubmitted
                  ? `Dihantar (${quizScore}/${HOME_QUIZ_QUESTIONS.length})`
                  : 'Belum dihantar'}
              </div>
            </div>
            <div className="rounded-xl border border-white/10 bg-[#160B33] p-3.5 text-xs">
              <div className="text-[#C6BBE6]">Refleksi Kendiri</div>
              <div
                className={`mt-1 font-bold ${
                  portfolio.homeReflectionNote.trim() ? 'text-[#26B9D1]' : 'text-[#FFC94A]'
                }`}
              >
                {portfolio.homeReflectionNote.trim() ? 'Telah diisi' : 'Belum diisi'}
              </div>
            </div>
          </div>

          <textarea
            rows={4}
            value={portfolio.homeReflectionNote}
            onChange={(e) =>
              onUpdatePortfolio((prev) => ({
                ...prev,
                homeReflectionNote: e.target.value,
              }))
            }
            placeholder="Contoh: Saya sudah faham cara memandang terus ke hadapan (K1). Di sekolah nanti, saya mahu fokus pada angkatan lutut aktif (K3)."
            className="w-full rounded-xl border border-white/15 bg-[#160B33] p-4 text-sm text-[#F7F5FC] placeholder-[#8E82B5] focus:border-[#26B9D1] focus:outline-none"
          />

          {homeCompletion.canFinishMission && (
            <div className="rounded-xl border border-[#26B9D1]/45 bg-[#26B9D1]/10 p-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="text-xs font-extrabold text-[#26B9D1]">
                  BERJAYA MENYELESAIKAN MISI PEMBELAJARAN KENDIRI
                </div>
                <p className="mt-0.5 text-xs text-[#E5DDF5]">
                  Semua aktiviti Mod Rumah telah lengkap. Kamu boleh terus menamatkan misi atau melihat ringkasan pencapaian Mod Rumah.
                </p>
              </div>
              <button
                type="button"
                onClick={onFinishMission}
                className="cursor-pointer inline-flex items-center gap-2 rounded-xl bg-[#FFC94A] px-5 py-3 text-xs sm:text-sm font-extrabold text-[#14092E] hover:bg-[#ffd56e] shadow-[0_0_20px_rgba(255,201,74,0.3)]"
              >
                <Trophy className="h-4 w-4" />
                TAMATKAN MISI
              </button>
            </div>
          )}

          <div className="flex flex-wrap justify-between gap-3">
            <button
              type="button"
              onClick={() => setStation('kuiz')}
              className="cursor-pointer inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-xs font-semibold text-[#F7F5FC] hover:bg-white/10"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Kembali ke Kuiz
            </button>
            <button
              type="button"
              onClick={onGoToRecords}
              className="cursor-pointer inline-flex items-center gap-2 rounded-xl bg-[#26B9D1] px-5 py-3 text-sm font-extrabold text-[#14092E] hover:bg-[#49CFE3]"
            >
              Lihat Ringkasan Pencapaian Mod Rumah
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
