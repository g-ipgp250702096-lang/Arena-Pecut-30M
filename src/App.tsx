import React, { useEffect, useState } from 'react';
import {
  AppScreen,
  CriterionCode,
  PupilPortfolio,
  TeacherValidation,
  TechniqueStatus,
} from './types/arena';
import { TopNav } from './components/TopNav';
import { HomeScreen } from './components/HomeScreen';
import { UserGuideScreen } from './components/UserGuideScreen';
import { ModeSelectionScreen } from './components/ModeSelectionScreen';
import { SchoolModeFlow } from './components/SchoolModeFlow';
import { HomeModeFlow } from './components/HomeModeFlow';
import { SprintSimulator } from './components/SprintSimulator';
import {
  EvidenceTeacherView,
  getMissionCompletionStatus,
} from './components/EvidenceTeacherView';
import { MissionCompletionScreen } from './components/MissionCompletionScreen';
import {
  safeScrollToTop,
  safeStorageGet,
  safeStorageRemove,
  safeStorageSet,
} from './utils/iframeSafe';

const STORAGE_KEY = 'arena_pecut_30m_portfolio_v1';

function createInitialPortfolio(): PupilPortfolio {
  return {
    activeMode: 'school',
    pupilName: '',
    pupilClass: '',
    safetyAccepted: false,
    quickCheckCompleted: false,
    quickCheckScore: 0,
    homeSafetyChecked: false,
    homeDemoCompleted: false,
    detectiveCompleted: false,
    detectiveScore: 0,
    safeChallengeDone: false,
    homeQuizAnswers: {},
    homeQuizSubmitted: false,
    homeReflectionNote: '',
    attempts: [
      { attemptNumber: 1, completed: false },
      { attemptNumber: 2, completed: false },
      { attemptNumber: 3, completed: false },
    ],
    teacherValidation: {
      teacherName: '',
      o1Validated: false,
      o2Validated: false,
      o3Validated: false,
      overallStatus: 'Belum Disahkan',
      teacherNotes: '',
    },
  };
}

function loadPortfolio(): PupilPortfolio {
  try {
    const raw = safeStorageGet(STORAGE_KEY);
    if (!raw) return createInitialPortfolio();
    const parsed = JSON.parse(raw) as Partial<PupilPortfolio>;
    const base = createInitialPortfolio();
    const normalizeStatus = (s: unknown): TechniqueStatus => {
      if (
        s === 'DAPAT DIPERHATIKAN' ||
        s === 'Menguasai' ||
        s === 'Memenuhi kriteria berdasarkan gambar'
      ) {
        return 'Memenuhi kriteria berdasarkan gambar';
      }
      if (s === 'PERLU PENAMBAHBAIKAN' || s === 'Perlu penambahbaikan') {
        return 'Perlu penambahbaikan';
      }
      return 'Tidak dapat dipastikan daripada gambar ini';
    };

    const rawAttempts =
      Array.isArray(parsed.attempts) && parsed.attempts.length === 3
        ? parsed.attempts
        : base.attempts;

    const normalizedAttempts = rawAttempts.map((att) => ({
      ...att,
      analysis: att?.analysis
        ? {
            ...att.analysis,
            criteria: (att.analysis.criteria || []).map((c) => ({
              ...c,
              status: normalizeStatus(c.status),
            })),
          }
        : undefined,
      frameAnalyses: Array.isArray(att?.frameAnalyses)
        ? att.frameAnalyses.map((fa) => ({
            ...fa,
            criteria: (fa.criteria || []).map((c) => ({
              ...c,
              status: normalizeStatus(c.status),
            })),
          }))
        : undefined,
    }));

    return {
      ...base,
      ...parsed,
      activeMode: parsed.activeMode === 'home' ? 'home' : 'school',
      homeSafetyChecked: Boolean(parsed.homeSafetyChecked),
      homeDemoCompleted: Boolean(parsed.homeDemoCompleted),
      detectiveCompleted: Boolean(parsed.detectiveCompleted),
      detectiveScore: typeof parsed.detectiveScore === 'number' ? parsed.detectiveScore : 0,
      safeChallengeDone: Boolean(parsed.safeChallengeDone),
      attempts: normalizedAttempts,
      teacherValidation: {
        ...base.teacherValidation,
        ...(parsed.teacherValidation || {}),
      },
    };
  } catch {
    return createInitialPortfolio();
  }
}

export default function App() {
  const [screen, setScreen] = useState<AppScreen>('home');
  const [prevScreen, setPrevScreen] = useState<AppScreen>('home');
  const [portfolio, setPortfolio] = useState<PupilPortfolio>(loadPortfolio);
  const [techCriterion, setTechCriterion] = useState<CriterionCode>('K1');
  const [confirmResetOpen, setConfirmResetOpen] = useState(false);

  useEffect(() => {
    try {
      // Strip raw base64 frame images when saving to localStorage to stay safely under storage quota
      const compactPortfolio: PupilPortfolio = {
        ...portfolio,
        attempts: portfolio.attempts.map((att) => ({
          ...att,
          frameAnalyses: att.frameAnalyses?.map((fa) => ({
            ...fa,
            frameDataUrl: undefined,
          })),
        })),
      };
      safeStorageSet(STORAGE_KEY, JSON.stringify(compactPortfolio));
    } catch {
      // Ignore storage quota errors gracefully
    }
  }, [portfolio]);

  const handleNavigate = (next: AppScreen) => {
    if (next !== screen) {
      setPrevScreen(screen);
    }
    if (next === 'school-mode') {
      setPortfolio((prev) =>
        prev.activeMode === 'school' ? prev : { ...prev, activeMode: 'school' }
      );
    } else if (next === 'home-mode') {
      setPortfolio((prev) =>
        prev.activeMode === 'home' ? prev : { ...prev, activeMode: 'home' }
      );
    }
    setScreen(next);
    safeScrollToTop();
  };

  const handleUpdateTeacherValidation = (validation: TeacherValidation) => {
    setPortfolio((prev) => ({
      ...prev,
      teacherValidation: validation,
    }));
  };

  const handleConfirmRestart = () => {
    const fresh = createInitialPortfolio();
    setPortfolio(fresh);
    safeStorageRemove(STORAGE_KEY);
    setConfirmResetOpen(false);
    handleNavigate('home');
  };

  return (
    <div className="min-h-screen bg-[#160B33] text-[#F7F5FC] flex flex-col">
      <TopNav currentScreen={screen} onNavigate={handleNavigate} />

        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 sm:py-8">
          {screen === 'home' && (
            <HomeScreen
              pupilName={portfolio.pupilName}
              pupilClass={portfolio.pupilClass}
              onUpdateProfile={(pupilName, pupilClass) =>
                setPortfolio((prev) => ({ ...prev, pupilName, pupilClass }))
              }
              onStartMission={() => handleNavigate('mode-select')}
              onOpenGuide={() => handleNavigate('guide')}
            />
          )}

          {screen === 'guide' && (
            <UserGuideScreen
              onBack={() => handleNavigate(prevScreen === 'guide' ? 'home' : prevScreen)}
              onMainMenu={() => handleNavigate('home')}
              onStartSchoolMode={() => handleNavigate('school-mode')}
              onStartHomeMode={() => handleNavigate('home-mode')}
            />
          )}

          {screen === 'mode-select' && (
            <ModeSelectionScreen
              onSelectSchoolMode={() => handleNavigate('school-mode')}
              onSelectHomeMode={() => handleNavigate('home-mode')}
              onBackHome={() => handleNavigate('home')}
            />
          )}

          {screen === 'school-mode' && (
            <SchoolModeFlow
              portfolio={portfolio}
              onUpdatePortfolio={setPortfolio}
              onBackToModes={() => handleNavigate('mode-select')}
              onGoToRecords={() => handleNavigate('records')}
            />
          )}

          {screen === 'home-mode' && (
            <HomeModeFlow
              portfolio={portfolio}
              onUpdatePortfolio={setPortfolio}
              onBackToModes={() => handleNavigate('mode-select')}
              onGoToRecords={() => handleNavigate('records')}
              onFinishMission={() => handleNavigate('mission-complete')}
            />
          )}

          {screen === 'techniques' && (
            <div className="space-y-6">
              <div className="rounded-2xl border border-white/15 bg-[#201146] p-6">
                <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-[#F7F5FC]">
                  Panduan Interaktif Teknik Larian Pecut K1–K4
                </h1>
                <p className="mt-1 text-sm text-[#D5CCE8]">
                  Terokai setiap kriteria teknik secara terperinci menggunakan simulasi pergerakan dan bimbingan visual Ejen Arif serta Ejen Aya.
                </p>
              </div>
              <SprintSimulator
                selectedCriterion={techCriterion}
                onSelectCriterion={setTechCriterion}
              />
            </div>
          )}

          {screen === 'records' && (
            <EvidenceTeacherView
              portfolio={portfolio}
              onUpdateTeacherValidation={handleUpdateTeacherValidation}
              onFinishMission={() => handleNavigate('mission-complete')}
              onRestartAll={() => setConfirmResetOpen(true)}
              onBackToActiveMode={() =>
                handleNavigate(
                  portfolio.activeMode === 'home' ? 'home-mode' : 'school-mode'
                )
              }
              onBackToModes={() => handleNavigate('mode-select')}
              onMainMenu={() => handleNavigate('home')}
            />
          )}

          {screen === 'mission-complete' &&
            (getMissionCompletionStatus(portfolio, portfolio.activeMode).canFinishMission ? (
              <MissionCompletionScreen
                portfolio={portfolio}
                onViewSummary={() => handleNavigate('records')}
                onBackToHome={() => handleNavigate('home')}
                onRequestRestart={() => setConfirmResetOpen(true)}
              />
            ) : (
              <EvidenceTeacherView
                portfolio={portfolio}
                onUpdateTeacherValidation={handleUpdateTeacherValidation}
                onFinishMission={() => handleNavigate('mission-complete')}
                onRestartAll={() => setConfirmResetOpen(true)}
                onBackToActiveMode={() =>
                  handleNavigate(
                    portfolio.activeMode === 'home' ? 'home-mode' : 'school-mode'
                  )
                }
                onBackToModes={() => handleNavigate('mode-select')}
                onMainMenu={() => handleNavigate('home')}
              />
            ))}
        </main>

        <footer className="no-print border-t border-white/10 bg-[#1B0E3B] px-4 py-5 text-center text-xs text-[#C6BBE6]">
          ARENA PECUT 30 METER · Pendidikan Jasmani Tahun 5 · Terokai Kemahiran, Cipta Kejayaan
        </footer>

        {/* Accessible Reset Confirmation Modal (no window.confirm/alert) */}
        {confirmResetOpen && (
          <div
            role="dialog"
            aria-modal="true"
            className="no-print fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
          >
            <div className="w-full max-w-md rounded-2xl border border-white/15 bg-[#22124A] p-6 text-[#F7F5FC] shadow-2xl">
              <h2 className="font-display text-lg font-bold">
                Mula Semula Sesi Baharu?
              </h2>
              <p className="mt-2 text-sm text-[#D5CCE8]">
                Semua rekod percubaan, jawapan kuiz dan pengesahan guru bagi sesi semasa akan dipadamkan untuk memulakan sesi murid baharu.
              </p>
              <div className="mt-5 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setConfirmResetOpen(false)}
                  className="cursor-pointer rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-xs font-semibold text-[#F7F5FC] hover:bg-white/10"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleConfirmRestart}
                  className="cursor-pointer rounded-xl bg-red-500 px-4 py-2 text-xs font-bold text-white hover:bg-red-600"
                >
                  Ya, Mula Semula
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
  );
}
