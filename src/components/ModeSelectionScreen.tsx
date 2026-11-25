import React from 'react';
import { ArrowLeft, ArrowRight, School, Home } from 'lucide-react';
import { ASSETS } from '../data/curriculumContent';

interface ModeSelectionScreenProps {
  onSelectSchoolMode: () => void;
  onSelectHomeMode: () => void;
  onBackHome: () => void;
}

export const ModeSelectionScreen: React.FC<ModeSelectionScreenProps> = ({
  onSelectSchoolMode,
  onSelectHomeMode,
  onBackHome,
}) => {
  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <button
              type="button"
              onClick={onBackHome}
              className="cursor-pointer inline-flex items-center gap-1.5 text-xs font-semibold text-[#26B9D1] hover:text-[#49CFE3]"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Kembali ke Pusat Operasi
            </button>
            <h1 className="font-display mt-2 text-2xl sm:text-3xl font-extrabold text-[#F7F5FC]">
              Pilih Mod Pembelajaran Kamu
            </h1>
            <p className="mt-1 text-sm text-[#C6BBE6]">
              DUA MOD, SATU MISI — Pilih laluan yang sesuai dengan lokasi dan aktiviti pembelajaran kamu hari ini.
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2 items-stretch">
        {/* MOD A: MOD SEKOLAH */}
        <article className="flex flex-col justify-between overflow-hidden rounded-2xl border border-[#26B9D1]/35 bg-[#201146]">
          <div>
            <div className="relative h-56 overflow-hidden bg-[#160B33]">
              <img
                src={ASSETS.stadiumHero}
                alt="Mod Sekolah Larian Sebenar 30 Meter"
                referrerPolicy="no-referrer"
                className="h-full w-full object-cover opacity-70"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#201146] via-[#201146]/40 to-transparent" />
              <img
                src={ASSETS.arifFull}
                alt="Arif membimbing Mod Sekolah"
                referrerPolicy="no-referrer"
                className="absolute right-4 bottom-0 h-52 w-auto object-contain drop-shadow-[0_10px_20px_rgba(0,0,0,0.65)]"
              />
              <div className="absolute bottom-4 left-5 right-32 flex items-center gap-2 text-xs font-bold text-[#26B9D1]">
                <School className="h-4 w-4 shrink-0" />
                <span>MOD A · BERSAMA GURU & EJEN ARIF</span>
              </div>
            </div>

            <div className="p-6">
              <h2 className="font-display text-2xl font-extrabold text-[#F7F5FC]">
                MOD SEKOLAH
              </h2>
              <p className="mt-1 text-sm font-semibold text-[#FFC94A]">
                Larian Sebenar 30 Meter dan Analisis Video Berpandukan Guru
              </p>
              <p className="mt-3 text-sm leading-relaxed text-[#D5CCE8]">
                Laluan pembelajaran praktikal di padang atau trek sekolah di bawah pengawasan guru Pendidikan Jasmani. Murid melakukan larian pecut 30 meter, merakam video dan menjalani semakan teknik K1–K4 melalui Analisis Video Berpandukan Guru.
              </p>

              <ul className="mt-4 space-y-2 text-xs text-[#E5DDF5]">
                <li>01. Taklimat Misi & 7 Peraturan Keselamatan</li>
                <li>02. Imbas Kembali Teknik K1–K4 bersama Simulasi</li>
                <li>03. Misi Larian Pecut 30 Meter (sehingga 3 percubaan)</li>
                <li>04. Analisis Video Berpandukan Guru, Penilaian K1–K4 & Refleksi O3</li>
                <li>05. Rekod Bukti & Pengesahan Guru</li>
              </ul>
            </div>
          </div>

          <div className="px-6 pb-6">
            <button
              type="button"
              onClick={onSelectSchoolMode}
              className="cursor-pointer inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#26B9D1] px-5 py-3.5 text-sm font-extrabold text-[#14092E] hover:bg-[#49CFE3] transition-colors"
            >
              MASUK MOD SEKOLAH
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </article>

        {/* MOD B: MOD RUMAH */}
        <article className="flex flex-col justify-between overflow-hidden rounded-2xl border border-[#B34BCB]/35 bg-[#201146]">
          <div>
            <div className="relative h-56 overflow-hidden bg-[#160B33]">
              <img
                src={ASSETS.homeTrack}
                alt="Mod Rumah Latihan Teknik dan Simulasi"
                referrerPolicy="no-referrer"
                className="h-full w-full object-cover opacity-75"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#201146] via-[#201146]/40 to-transparent" />
              <img
                src={ASSETS.ayaFull}
                alt="Aya membimbing Mod Rumah"
                referrerPolicy="no-referrer"
                className="absolute right-4 bottom-0 h-52 w-auto object-contain drop-shadow-[0_10px_20px_rgba(0,0,0,0.65)]"
              />
              <div className="absolute bottom-4 left-5 right-32 flex items-center gap-2 text-xs font-bold text-[#FFC94A]">
                <Home className="h-4 w-4 shrink-0" />
                <span>MOD B · LATIHAN KENDIRI BERSAMA EJEN AYA</span>
              </div>
            </div>

            <div className="p-6">
              <h2 className="font-display text-2xl font-extrabold text-[#F7F5FC]">
                MOD RUMAH
              </h2>
              <p className="mt-1 text-sm font-semibold text-[#26B9D1]">
                Penerokaan Teknik, Simulasi Interaktif & Cabaran Pemerhatian
              </p>
              <p className="mt-3 text-sm leading-relaxed text-[#D5CCE8]">
                Laluan pembelajaran selamat di rumah tanpa memerlukan trek larian 30 meter. Murid menguasai teknik K1–K4 melalui makmal simulasi perlahan, latihan statik selamat dan kuiz pemerhatian untuk memenuhi Objektif O1.
              </p>

              <ul className="mt-4 space-y-2 text-xs text-[#E5DDF5]">
                <li>01. Keselamatan Di Rumah & Latihan Teknik Statik</li>
                <li>02. Makmal Simulasi Interaktif K1–K4</li>
                <li>03. Cabaran Pemerhatian & Kuiz Kriteria Teknik (O1)</li>
                <li>04. Refleksi Kendiri & Persediaan Sesi Sekolah</li>
              </ul>
            </div>
          </div>

          <div className="px-6 pb-6">
            <button
              type="button"
              onClick={onSelectHomeMode}
              className="cursor-pointer inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#FFC94A] px-5 py-3.5 text-sm font-extrabold text-[#14092E] hover:bg-[#ffd56e] transition-colors"
            >
              MASUK MOD RUMAH
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </article>
      </div>
    </div>
  );
};
