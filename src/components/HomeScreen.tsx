import React, { useState } from 'react';
import { ArrowRight, BookOpen, ChevronDown, ChevronUp } from 'lucide-react';
import { ASSETS, CURRICULUM_INFO } from '../data/curriculumContent';

interface HomeScreenProps {
  pupilName: string;
  pupilClass: string;
  onUpdateProfile: (name: string, className: string) => void;
  onStartMission: () => void;
  onOpenGuide: () => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  pupilName,
  pupilClass,
  onUpdateProfile,
  onStartMission,
  onOpenGuide,
}) => {
  const [showInstructions, setShowInstructions] = useState(false);

  return (
    <div className="space-y-8">
      {/* Immersive Futuristic Sprint Arena Hero */}
      <section className="relative overflow-hidden rounded-3xl border border-white/15 bg-[#201146]">
        <div className="absolute inset-0">
          <img
            src={ASSETS.stadiumHero}
            alt="Stadium Larian Pecut 30 Meter Futuristik"
            referrerPolicy="no-referrer"
            className="h-full w-full object-cover opacity-40"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#160B33]/95 via-[#281653]/85 to-[#160B33]/80" />
        </div>

        <div className="relative z-10 grid gap-8 p-6 sm:p-10 lg:grid-cols-12 items-stretch">
          {/* Left Hero Column */}
          <div className="lg:col-span-7 flex flex-col justify-between space-y-6">
            <div>
              <p className="text-xs font-semibold tracking-wide text-[#26B9D1]">
                {CURRICULUM_INFO.subject} · {CURRICULUM_INFO.standardKandungan}
              </p>

              <h1 className="font-display mt-3 text-3xl sm:text-5xl font-extrabold tracking-tight text-[#F7F5FC] leading-[1.08]">
                ARENA PECUT <span className="text-[#FFC94A]">30 METER</span>
              </h1>

              <p className="mt-2 font-display text-lg sm:text-xl font-bold text-[#26B9D1]">
                DUA MOD, SATU MISI
              </p>

              <p className="mt-3 max-w-xl text-sm sm:text-base leading-relaxed text-[#E5DDF5]">
                Terokai kemahiran asas berlari pecut dengan betul bersama Ejen Arif dan Ejen Aya.{' '}
                <span className="font-semibold text-[#FFC94A]">
                  TEROKAI KEMAHIRAN, CIPTA KEJAYAAN.
                </span>
              </p>
            </div>

            {/* Pupil Identity Inputs (Stored locally for O1-O3 Evidence) */}
            <div className="grid gap-3 sm:grid-cols-2 max-w-xl rounded-2xl border border-white/15 bg-[#160B33]/80 p-4">
              <div>
                <label
                  htmlFor="pupil-name"
                  className="block text-xs font-semibold text-[#C6BBE6] mb-1"
                >
                  Nama Murid
                </label>
                <input
                  id="pupil-name"
                  type="text"
                  value={pupilName}
                  onChange={(e) => onUpdateProfile(e.target.value, pupilClass)}
                  placeholder="Contoh: Adam Hakim"
                  className="w-full rounded-lg border border-white/15 bg-[#201146] px-3 py-2 text-sm text-[#F7F5FC] placeholder-[#8E82B5] focus:border-[#26B9D1] focus:outline-none"
                />
              </div>
              <div>
                <label
                  htmlFor="pupil-class"
                  className="block text-xs font-semibold text-[#C6BBE6] mb-1"
                >
                  Kelas Tahun 5
                </label>
                <input
                  id="pupil-class"
                  type="text"
                  value={pupilClass}
                  onChange={(e) => onUpdateProfile(pupilName, e.target.value)}
                  placeholder="Contoh: 5 Zamrud"
                  className="w-full rounded-lg border border-white/15 bg-[#201146] px-3 py-2 text-sm text-[#F7F5FC] placeholder-[#8E82B5] focus:border-[#26B9D1] focus:outline-none"
                />
              </div>
            </div>

            {/* Primary CTA & Dedicated User Guide Button */}
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={onStartMission}
                className="cursor-pointer inline-flex items-center gap-2.5 rounded-xl bg-[#FFC94A] px-6 py-3.5 text-sm font-extrabold text-[#14092E] hover:bg-[#ffd56e] transition-colors shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#26B9D1]"
              >
                MULAKAN MISI
                <ArrowRight className="h-4 w-4" />
              </button>

              <button
                type="button"
                onClick={onOpenGuide}
                className="cursor-pointer inline-flex items-center gap-2 rounded-xl bg-[#26B9D1] px-5 py-3.5 text-sm font-extrabold text-[#14092E] hover:bg-[#49CFE3] transition-colors shadow-lg"
              >
                <BookOpen className="h-4 w-4" />
                PANDUAN PENGGUNAAN APLIKASI
              </button>
            </div>
          </div>

          {/* Right Column: Official Arif & Aya Renders + Opening Dialogue */}
          <div className="lg:col-span-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
            {/* Arif Card */}
            <div className="flex items-center gap-4 rounded-2xl border border-white/15 bg-[#281653]/90 p-4">
              <div className="h-36 w-24 shrink-0 overflow-hidden rounded-xl border border-[#26B9D1]/40 bg-gradient-to-b from-[#3A217A] to-[#160B33] pt-1.5 px-1">
                <img
                  src={ASSETS.arifFull}
                  alt="Arif Ejen Kemahiran"
                  referrerPolicy="no-referrer"
                  className="h-full w-full object-contain object-bottom"
                />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold text-[#26B9D1]">
                  ARIF · EJEN KEMAHIRAN
                </div>
                <p className="mt-1.5 text-xs sm:text-sm leading-relaxed text-[#F7F5FC]">
                  “Hai, Ejen Pecut! Selamat datang ke Arena Pecut 30 Meter! Jom mulakan misi! Pilih mod pembelajaran kamu dan bersedia untuk cabaran!”
                </p>
              </div>
            </div>

            {/* Aya Card */}
            <div className="flex items-center gap-4 rounded-2xl border border-white/15 bg-[#281653]/90 p-4">
              <div className="h-36 w-24 shrink-0 overflow-hidden rounded-xl border border-[#B34BCB]/50 bg-gradient-to-b from-[#3A217A] to-[#160B33] pt-1.5 px-1">
                <img
                  src={ASSETS.ayaFull}
                  alt="Aya Ejen Analisis"
                  referrerPolicy="no-referrer"
                  className="h-full w-full object-contain object-bottom"
                />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold text-[#FFC94A]">
                  AYA · EJEN ANALISIS
                </div>
                <p className="mt-1.5 text-xs sm:text-sm leading-relaxed text-[#F7F5FC]">
                  “Sedia untuk meneroka teknik larian pecut? Bersama-sama, kita akan belajar mengenal pasti teknik yang betul dan memperbaik larian kita!”
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Curriculum & Accessible Instructions Strip */}
      <section className="rounded-2xl border border-white/15 bg-[#201146] p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="font-display text-lg font-bold text-[#F7F5FC]">
              Rujukan Kurikulum & Objektif Pembelajaran
            </h2>
            <p className="mt-1 text-xs text-[#C6BBE6]">
              {CURRICULUM_INFO.standardPembelajaran} · {CURRICULUM_INFO.practicalNote}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={onOpenGuide}
              className="cursor-pointer inline-flex items-center gap-2 rounded-xl bg-[#7042C5] px-4 py-2 text-xs font-bold text-white hover:bg-[#8255D6]"
            >
              <BookOpen className="h-4 w-4 text-[#FFC94A]" />
              Buka Panduan Lengkap
            </button>
            <button
              type="button"
              onClick={() => setShowInstructions((v) => !v)}
              className="cursor-pointer inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-xs font-semibold text-[#F7F5FC] hover:bg-white/10"
            >
              Ringkasan Cepat
              {showInstructions ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-3">
          {CURRICULUM_INFO.objectives.map((obj) => (
            <div
              key={obj.code}
              className="rounded-xl border border-white/10 bg-[#160B33] p-4"
            >
              <div className="font-mono-data text-xs font-bold text-[#FFC94A]">
                OBJEKTIF {obj.code}
              </div>
              <h3 className="mt-1 font-display text-sm font-bold text-[#F7F5FC]">
                {obj.title}
              </h3>
              <p className="mt-1.5 text-xs leading-relaxed text-[#D5CCE8]">
                {obj.description}
              </p>
            </div>
          ))}
        </div>

        {showInstructions && (
          <div className="mt-5 grid gap-4 border-t border-white/10 pt-5 sm:grid-cols-2 lg:grid-cols-4 text-xs leading-relaxed text-[#E5DDF5]">
            <div className="rounded-xl border border-white/10 bg-[#281653] p-3.5">
              <div className="font-bold text-[#26B9D1]">1. Pilih Mod</div>
              <p className="mt-1">
                Gunakan Mod Sekolah untuk larian sebenar 30 meter dan Analisis Video Berpandukan Guru. Gunakan Mod Rumah untuk simulasi teknik dan kuiz pemerhatian.
              </p>
            </div>
            <div className="rounded-xl border border-white/10 bg-[#281653] p-3.5">
              <div className="font-bold text-[#26B9D1]">2. Panduan Ejen Arif & Aya</div>
              <p className="mt-1">
                Ikuti arahan ringkas dan ilustrasi daripada Ejen Arif serta Ejen Aya pada setiap langkah aktiviti.
              </p>
            </div>
            <div className="rounded-xl border border-white/10 bg-[#281653] p-3.5">
              <div className="font-bold text-[#26B9D1]">3. Semak Teknik K1–K4</div>
              <p className="mt-1">
                Fokus pada kedudukan kepala & badan (K1), ayunan tangan (K2), pergerakan kaki (K3), dan sentuhan serta tolakan kaki (K4).
              </p>
            </div>
            <div className="rounded-xl border border-white/10 bg-[#281653] p-3.5">
              <div className="font-bold text-[#26B9D1]">4. Pengesahan Guru</div>
              <p className="mt-1">
                Semua rekod percubaan dan refleksi murid dikumpulkan untuk semakan dan pengesahan guru Pendidikan Jasmani.
              </p>
            </div>
          </div>
        )}
      </section>
    </div>
  );
};
