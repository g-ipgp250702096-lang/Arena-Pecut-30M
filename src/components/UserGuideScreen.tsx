import React, { useState } from 'react';
import {
  ArrowLeft,
  Home,
  School,
  BookOpen,
  ArrowRight,
} from 'lucide-react';
import {
  ASSETS,
  PANDUAN_MOD_RUMAH,
  PANDUAN_MOD_SEKOLAH,
} from '../data/curriculumContent';

interface UserGuideScreenProps {
  onBack: () => void;
  onMainMenu: () => void;
  onStartSchoolMode: () => void;
  onStartHomeMode: () => void;
}

export const UserGuideScreen: React.FC<UserGuideScreenProps> = ({
  onBack,
  onMainMenu,
  onStartSchoolMode,
  onStartHomeMode,
}) => {
  const [activeTab, setActiveTab] = useState<'semua' | 'sekolah' | 'rumah'>('semua');

  return (
    <div className="space-y-6">
      {/* Top Navigation & Title */}
      <div className="rounded-2xl border border-white/15 bg-[#201146] p-6 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={onBack}
              className="cursor-pointer inline-flex items-center gap-1.5 rounded-xl border border-white/15 bg-white/5 px-3.5 py-2 text-xs font-semibold text-[#F7F5FC] hover:bg-white/10"
            >
              <ArrowLeft className="h-3.5 w-3.5 text-[#26B9D1]" />
              Kembali
            </button>
            <button
              type="button"
              onClick={onMainMenu}
              className="cursor-pointer inline-flex items-center gap-1.5 rounded-xl border border-white/15 bg-white/5 px-3.5 py-2 text-xs font-semibold text-[#F7F5FC] hover:bg-white/10"
            >
              <Home className="h-3.5 w-3.5 text-[#FFC94A]" />
              Menu Utama
            </button>
          </div>

          {/* Filter Tabs */}
          <div className="flex flex-wrap items-center gap-1 rounded-xl bg-[#160B33] p-1 border border-white/10">
            <button
              type="button"
              onClick={() => setActiveTab('semua')}
              className={`cursor-pointer rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                activeTab === 'semua'
                  ? 'bg-[#26B9D1] text-[#14092E]'
                  : 'text-[#C6BBE6] hover:text-white'
              }`}
            >
              Semua Panduan
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('sekolah')}
              className={`cursor-pointer rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                activeTab === 'sekolah'
                  ? 'bg-[#26B9D1] text-[#14092E]'
                  : 'text-[#C6BBE6] hover:text-white'
              }`}
            >
              Mod Sekolah
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('rumah')}
              className={`cursor-pointer rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                activeTab === 'rumah'
                  ? 'bg-[#FFC94A] text-[#14092E]'
                  : 'text-[#C6BBE6] hover:text-white'
              }`}
            >
              Mod Rumah
            </button>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-12 items-center">
          <div className="lg:col-span-7 space-y-3">
            <div className="inline-flex items-center gap-2 text-xs font-bold text-[#26B9D1]">
              <BookOpen className="h-4 w-4" />
              <span>PANDUAN PENGGUNAAN APLIKASI · TAHUN 5</span>
            </div>
            <h1 className="font-display text-2xl sm:text-4xl font-extrabold text-[#F7F5FC]">
              PANDUAN PENGGUNAAN APLIKASI
            </h1>
            <p className="text-sm leading-relaxed text-[#E5DDF5]">
              Ikuti langkah mudah di bawah untuk menggunakan Arena Pecut 30 Meter sama ada bersama guru di sekolah atau secara kendiri di rumah.
            </p>
          </div>

          {/* Arif & Aya Guide Intro Cards */}
          <div className="lg:col-span-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
            <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-[#160B33] p-3">
              <div className="h-16 w-14 shrink-0 overflow-hidden rounded-lg border border-[#26B9D1]/40 bg-[#281653] pt-1">
                <img
                  src={ASSETS.arifPortrait}
                  alt="Arif Ejen Kemahiran"
                  referrerPolicy="no-referrer"
                  className="h-full w-full object-contain object-top"
                />
              </div>
              <div className="text-xs text-[#E5DDF5]">
                <div className="font-bold text-[#26B9D1]">Arif · Ejen Kemahiran</div>
                <p className="mt-0.5">
                  “Ikuti setiap langkah satu demi satu supaya kamu bersedia di trek!”
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-[#160B33] p-3">
              <div className="h-16 w-14 shrink-0 overflow-hidden rounded-lg border border-[#FFC94A]/40 bg-[#281653] pt-1">
                <img
                  src={ASSETS.ayaPortrait}
                  alt="Aya Ejen Analisis"
                  referrerPolicy="no-referrer"
                  className="h-full w-full object-contain object-top"
                />
              </div>
              <div className="text-xs text-[#E5DDF5]">
                <div className="font-bold text-[#FFC94A]">Aya · Ejen Analisis</div>
                <p className="mt-0.5">
                  “Baca arahan ringkas dan perhatikan ilustrasi pada setiap bahagian sebelum memulakan aktiviti.”
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Step Cards Grid */}
      <div className="grid gap-6 lg:grid-cols-2 items-start">
        {/* PANDUAN MOD SEKOLAH */}
        {(activeTab === 'semua' || activeTab === 'sekolah') && (
          <section className="rounded-2xl border border-[#26B9D1]/35 bg-[#201146] p-6 space-y-5">
            <div className="border-b border-white/10 pb-4">
              <div className="flex items-center gap-2 text-xs font-bold text-[#26B9D1]">
                <School className="h-4 w-4" />
                <span>MOD A · BERSAMA GURU</span>
              </div>
              <h2 className="font-display mt-1 text-xl font-extrabold text-[#F7F5FC]">
                PANDUAN MOD SEKOLAH
              </h2>
            </div>

            <ol className="space-y-2.5">
              {PANDUAN_MOD_SEKOLAH.map((step, idx) => (
                <li
                  key={idx}
                  className="flex items-start gap-3 rounded-xl border border-white/10 bg-[#160B33] p-3 text-sm text-[#E5DDF5]"
                >
                  <span className="font-mono-data inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-[#26B9D1]/15 text-xs font-bold text-[#26B9D1]">
                    {idx + 1}
                  </span>
                  <span className="leading-snug">{step}</span>
                </li>
              ))}
            </ol>

            <button
              type="button"
              onClick={onStartSchoolMode}
              className="cursor-pointer inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#26B9D1] px-5 py-3 text-sm font-extrabold text-[#14092E] hover:bg-[#49CFE3]"
            >
              Mula Mod Sekolah Sekarang
              <ArrowRight className="h-4 w-4" />
            </button>
          </section>
        )}

        {/* PANDUAN MOD RUMAH */}
        {(activeTab === 'semua' || activeTab === 'rumah') && (
          <section className="rounded-2xl border border-[#FFC94A]/35 bg-[#201146] p-6 space-y-5">
            <div className="border-b border-white/10 pb-4">
              <div className="flex items-center gap-2 text-xs font-bold text-[#FFC94A]">
                <Home className="h-4 w-4" />
                <span>MOD B · PEMBELAJARAN KENDIRI</span>
              </div>
              <h2 className="font-display mt-1 text-xl font-extrabold text-[#F7F5FC]">
                PANDUAN MOD RUMAH
              </h2>
            </div>

            <ol className="space-y-2.5">
              {PANDUAN_MOD_RUMAH.map((step, idx) => (
                <li
                  key={idx}
                  className="flex items-start gap-3 rounded-xl border border-white/10 bg-[#160B33] p-3 text-sm text-[#E5DDF5]"
                >
                  <span className="font-mono-data inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-[#FFC94A]/15 text-xs font-bold text-[#FFC94A]">
                    {idx + 1}
                  </span>
                  <span className="leading-snug">{step}</span>
                </li>
              ))}
            </ol>

            <button
              type="button"
              onClick={onStartHomeMode}
              className="cursor-pointer inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#FFC94A] px-5 py-3 text-sm font-extrabold text-[#14092E] hover:bg-[#ffd56e]"
            >
              Mula Mod Rumah Sekarang
              <ArrowRight className="h-4 w-4" />
            </button>
          </section>
        )}
      </div>
    </div>
  );
};
