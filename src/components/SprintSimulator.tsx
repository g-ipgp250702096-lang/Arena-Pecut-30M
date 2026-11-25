import React, { useEffect, useRef, useState } from 'react';
import { Play, Pause, RotateCcw } from 'lucide-react';
import { CriterionCode } from '../types/arena';
import { ASSETS, CRITERIA_SPECS } from '../data/curriculumContent';

interface SprintSimulatorProps {
  selectedCriterion: CriterionCode;
  onSelectCriterion: (code: CriterionCode) => void;
}

export const SprintSimulator: React.FC<SprintSimulatorProps> = ({
  selectedCriterion,
  onSelectCriterion,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [speed, setSpeed] = useState<number>(0.5);
  const [demoMode, setDemoMode] = useState<'betul' | 'kesilapan'>('betul');
  const phaseRef = useRef(0);

  const currentSpec =
    CRITERIA_SPECS.find((c) => c.code === selectedCriterion) || CRITERIA_SPECS[0];

  useEffect(() => {
    let rafId = 0;
    let lastTime = performance.now();

    const drawRunner = (now: number) => {
      const dt = Math.min(0.05, (now - lastTime) / 1000);
      lastTime = now;
      if (isPlaying) {
        phaseRef.current = (phaseRef.current + dt * speed * 2.4) % (Math.PI * 2);
      }

      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          const w = canvas.width;
          const h = canvas.height;
          ctx.clearRect(0, 0, w, h);

          // Stadium dark royal backdrop
          const bgGrad = ctx.createLinearGradient(0, 0, 0, h);
          bgGrad.addColorStop(0, '#1B0E3B');
          bgGrad.addColorStop(1, '#281653');
          ctx.fillStyle = bgGrad;
          ctx.fillRect(0, 0, w, h);

          // Perspective grid & track floor
          const groundY = h * 0.82;
          ctx.fillStyle = '#331D69';
          ctx.fillRect(0, groundY, w, h - groundY);

          // Moving track markers
          const markerOffset = ((phaseRef.current / (Math.PI * 2)) * 120) % 120;
          ctx.strokeStyle = 'rgba(38, 185, 209, 0.35)';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(0, groundY);
          ctx.lineTo(w, groundY);
          ctx.stroke();

          for (let x = -markerOffset; x < w + 120; x += 120) {
            ctx.strokeStyle = 'rgba(255, 201, 74, 0.35)';
            ctx.beginPath();
            ctx.moveTo(x, groundY + 4);
            ctx.lineTo(x - 24, h);
            ctx.stroke();
          }

          const p = phaseRef.current;
          const isMistake = demoMode === 'kesilapan';

          // Center hip anchor with subtle vertical bounce
          const bounce = Math.abs(Math.sin(p)) * -10;
          const hipX = w * 0.48;
          const hipY = groundY - 122 + bounce;

          // Trunk lean
          const trunkLeanRad =
            isMistake && selectedCriterion === 'K1'
              ? 0.42 // over-hunched mistake
              : isMistake
                ? 0.04
                : 0.22; // healthy slight sprint lean

          const torsoLen = 78;
          const shoulderX = hipX + Math.sin(trunkLeanRad) * torsoLen;
          const shoulderY = hipY - Math.cos(trunkLeanRad) * torsoLen;

          // Head
          const headTilt =
            isMistake && selectedCriterion === 'K1' ? 0.55 : 0.04;
          const headX = shoulderX + Math.sin(trunkLeanRad + headTilt) * 28;
          const headY = shoulderY - Math.cos(trunkLeanRad + headTilt) * 28;

          // Gaze vector for K1
          if (selectedCriterion === 'K1') {
            ctx.save();
            ctx.strokeStyle = isMistake ? '#FF6B6B' : '#26B9D1';
            ctx.setLineDash([5, 5]);
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            ctx.moveTo(headX + 12, headY - 2);
            if (isMistake) {
              ctx.lineTo(headX + 95, headY + 85); // looking down
            } else {
              ctx.lineTo(headX + 130, headY - 2); // straight forward
            }
            ctx.stroke();
            ctx.restore();
          }

          const drawLimb = (
            x1: number,
            y1: number,
            x2: number,
            y2: number,
            color: string,
            width = 10
          ) => {
            ctx.strokeStyle = color;
            ctx.lineWidth = width;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.stroke();
          };

          const drawJoint = (x: number, y: number, r: number, color: string) => {
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.arc(x, y, r, 0, Math.PI * 2);
            ctx.fill();
          };

          // Compute leg kinematics (front & back leg alternating)
          const kneeAmp = isMistake && selectedCriterion === 'K3' ? 0.35 : 0.95;
          const drawLeg = (phaseOffset: number, isBack: boolean) => {
            const legPhase = p + phaseOffset;
            const thighAngle = Math.sin(legPhase) * kneeAmp + 0.15;
            const thighLen = 58;
            const shinLen = 58;

            const kneeX = hipX + Math.sin(thighAngle) * thighLen;
            const kneeY = hipY + Math.cos(thighAngle) * thighLen;

            // Shin bends back during swing, extends on push-off
            const shinBend = Math.max(0.1, -Math.cos(legPhase) * 0.85 + 0.45);
            const ankleX = kneeX + Math.sin(thighAngle - shinBend) * shinLen;
            const ankleY = Math.min(
              groundY - 6,
              kneeY + Math.cos(thighAngle - shinBend) * shinLen
            );

            const legColor =
              selectedCriterion === 'K3'
                ? isMistake
                  ? '#FF7B7B'
                  : isBack
                    ? '#1A8598'
                    : '#26B9D1'
                : isBack
                  ? '#5B399E'
                  : '#9F7AE6';

            drawLimb(hipX, hipY, kneeX, kneeY, legColor, 11);
            drawLimb(kneeX, kneeY, ankleX, ankleY, legColor, 9);

            // Foot / forefoot vs heel strike
            const footAngle =
              isMistake && selectedCriterion === 'K4' ? -0.45 : 0.22;
            const toeX = ankleX + Math.cos(footAngle) * 20;
            const toeY = ankleY + Math.sin(footAngle) * 10;
            const footColor =
              selectedCriterion === 'K4'
                ? isMistake
                  ? '#FF7B7B'
                  : '#FFC94A'
                : '#F7F5FC';
            drawLimb(ankleX, ankleY, toeX, toeY, footColor, 7);

            if (selectedCriterion === 'K3' && !isBack) {
              drawJoint(kneeX, kneeY, 6, '#FFC94A');
            }
            if (selectedCriterion === 'K4' && ankleY >= groundY - 14) {
              ctx.strokeStyle = isMistake ? '#FF7B7B' : '#FFC94A';
              ctx.lineWidth = 2.5;
              ctx.beginPath();
              ctx.arc(toeX - 4, groundY - 2, 14, Math.PI, 0);
              ctx.stroke();
            }
          };

          // Compute arm kinematics (opposite to legs)
          const drawArm = (phaseOffset: number, isBack: boolean) => {
            const armPhase = p + phaseOffset;
            const shoulderSwing = Math.sin(armPhase) * 0.78;
            const upperArmLen = 42;
            const foreArmLen = 38;

            const elbowX = shoulderX + Math.sin(shoulderSwing) * upperArmLen;
            const elbowY = shoulderY + Math.cos(shoulderSwing) * upperArmLen;

            // Mistake K2: straight arm or awkward cross-chest
            const elbowFlex =
              isMistake && selectedCriterion === 'K2' ? 0.15 : 1.45;
            const wristX = elbowX + Math.sin(shoulderSwing + elbowFlex) * foreArmLen;
            const wristY = elbowY + Math.cos(shoulderSwing + elbowFlex) * foreArmLen;

            const armColor =
              selectedCriterion === 'K2'
                ? isMistake
                  ? '#FF7B7B'
                  : isBack
                    ? '#C89B2D'
                    : '#FFC94A'
                : isBack
                  ? '#6540A8'
                  : '#E2D9F3';

            drawLimb(shoulderX, shoulderY, elbowX, elbowY, armColor, 8);
            drawLimb(elbowX, elbowY, wristX, wristY, armColor, 7);
            if (selectedCriterion === 'K2' && !isBack) {
              drawJoint(elbowX, elbowY, 5.5, '#26B9D1');
            }
          };

          // Draw back limbs first
          drawLeg(Math.PI, true);
          drawArm(0, true);

          // Draw torso
          const torsoColor =
            selectedCriterion === 'K1'
              ? isMistake
                ? '#FF7B7B'
                : '#26B9D1'
              : '#E53935';
          drawLimb(hipX, hipY, shoulderX, shoulderY, torsoColor, 15);

          // Draw head
          ctx.fillStyle = '#F3C6A5';
          ctx.beginPath();
          ctx.arc(headX, headY, 17, 0, Math.PI * 2);
          ctx.fill();

          // Cyan glasses detail (Arif signature)
          ctx.strokeStyle = '#26B9D1';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(headX + 4, headY - 2);
          ctx.lineTo(headX + 16, headY - 2);
          ctx.stroke();

          // Draw front limbs
          drawLeg(0, false);
          drawArm(Math.PI, false);

          // Highlight ring on active criterion zone
          const zoneMap: Record<CriterionCode, { x: number; y: number; r: number }> = {
            K1: { x: headX, y: headY + 18, r: 44 },
            K2: { x: shoulderX + 8, y: shoulderY + 26, r: 46 },
            K3: { x: hipX + 16, y: hipY + 42, r: 50 },
            K4: { x: hipX, y: groundY - 12, r: 46 },
          };
          const zone = zoneMap[selectedCriterion];
          ctx.save();
          ctx.strokeStyle = isMistake ? 'rgba(255, 107, 107, 0.85)' : 'rgba(255, 201, 74, 0.85)';
          ctx.lineWidth = 2;
          ctx.setLineDash([6, 4]);
          ctx.beginPath();
          ctx.arc(zone.x, zone.y, zone.r, 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();
        }
      }

      rafId = requestAnimationFrame(drawRunner);
    };

    rafId = requestAnimationFrame(drawRunner);
    return () => cancelAnimationFrame(rafId);
  }, [demoMode, isPlaying, selectedCriterion, speed]);

  const coachIsArif = currentSpec.guideAgent === 'arif';

  return (
    <div className="grid gap-6 lg:grid-cols-12 items-stretch">
      {/* Left/Top Zone: Interactive Simulation Stage (60%+) */}
      <div className="lg:col-span-7 flex flex-col rounded-2xl border border-white/15 bg-[#201146] p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3">
          <div>
            <h3 className="font-display text-lg font-bold text-[#F7F5FC]">
              Simulasi Pergerakan Teknik {selectedCriterion}
            </h3>
            <p className="text-xs text-[#C6BBE6]">
              Bandingkan lakuan betul dengan kesilapan biasa pada kelajuan perlahan.
            </p>
          </div>
          <div className="flex items-center gap-1 rounded-lg bg-[#160B33] p-1 border border-white/10">
            <button
              type="button"
              onClick={() => setDemoMode('betul')}
              className={`cursor-pointer rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
                demoMode === 'betul'
                  ? 'bg-[#26B9D1] text-[#14092E]'
                  : 'text-[#C6BBE6] hover:text-white'
              }`}
            >
              Teknik Betul
            </button>
            <button
              type="button"
              onClick={() => setDemoMode('kesilapan')}
              className={`cursor-pointer rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
                demoMode === 'kesilapan'
                  ? 'bg-[#FFC94A] text-[#14092E]'
                  : 'text-[#C6BBE6] hover:text-white'
              }`}
            >
              Kesilapan Biasa
            </button>
          </div>
        </div>

        <div className="relative flex-1 overflow-hidden rounded-xl border border-white/10 bg-[#1B0E3B]">
          <canvas
            ref={canvasRef}
            width={680}
            height={340}
            className="h-full w-full object-contain"
          />
        </div>

        {/* Playback Controls */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsPlaying((p) => !p)}
              className="cursor-pointer inline-flex items-center gap-1.5 rounded-lg bg-[#7042C5] px-3.5 py-2 text-xs font-bold text-white hover:bg-[#8255D6] transition-colors"
            >
              {isPlaying ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
              {isPlaying ? 'Jeda' : 'Main'}
            </button>
            <button
              type="button"
              onClick={() => {
                phaseRef.current = 0;
              }}
              className="cursor-pointer inline-flex items-center gap-1.5 rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-xs font-medium text-[#F7F5FC] hover:bg-white/10"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Set Semula
            </button>
          </div>

          <div className="flex items-center gap-3">
            <label htmlFor="sim-speed" className="text-xs font-medium text-[#C6BBE6]">
              Kelajuan: <span className="font-mono-data text-[#FFC94A]">{speed.toFixed(2)}x</span>
            </label>
            <input
              id="sim-speed"
              type="range"
              min={0.25}
              max={1.25}
              step={0.25}
              value={speed}
              onChange={(e) => setSpeed(Number(e.target.value))}
              className="w-28 accent-[#26B9D1]"
            />
          </div>
        </div>
      </div>

      {/* Right/Bottom Zone: Criterion Concept Deck + Official Character Coaching */}
      <div className="lg:col-span-5 flex flex-col justify-between rounded-2xl border border-white/15 bg-[#201146] p-5 space-y-4">
        <div>
          {/* K1-K4 Selector Tabs */}
          <div className="grid grid-cols-4 gap-1.5 rounded-xl bg-[#160B33] p-1.5 border border-white/10">
            {CRITERIA_SPECS.map((spec) => {
              const active = spec.code === selectedCriterion;
              return (
                <button
                  key={spec.code}
                  type="button"
                  onClick={() => onSelectCriterion(spec.code)}
                  className={`cursor-pointer rounded-lg py-2 text-xs font-bold transition-colors ${
                    active
                      ? 'bg-[#26B9D1] text-[#14092E]'
                      : 'text-[#C6BBE6] hover:bg-white/5 hover:text-white'
                  }`}
                >
                  {spec.code}
                </button>
              );
            })}
          </div>

          {/* Character Coach Strip */}
          <div className="mt-4 flex items-center gap-3 rounded-xl border border-white/10 bg-[#160B33] p-3">
            <div className="h-14 w-12 shrink-0 overflow-hidden rounded-lg border border-[#26B9D1]/40 bg-[#281653] pt-0.5">
              <img
                src={coachIsArif ? ASSETS.arifPortrait : ASSETS.ayaPortrait}
                alt={coachIsArif ? 'Arif Ejen Kemahiran' : 'Aya Ejen Analisis'}
                referrerPolicy="no-referrer"
                className="h-full w-full object-contain object-top"
              />
            </div>
            <div className="min-w-0 text-xs">
              <div className={`font-bold ${coachIsArif ? 'text-[#26B9D1]' : 'text-[#FFC94A]'}`}>
                {coachIsArif ? 'ARIF · EJEN KEMAHIRAN' : 'AYA · EJEN ANALISIS'}
              </div>
              <p className="mt-0.5 text-[#D5CCE8]">
                {demoMode === 'betul'
                  ? `Perhatikan lakuan betul bagi ${currentSpec.shortTitle} pada simulasi di sebelah.`
                  : `Awasi kesilapan biasa: ${currentSpec.commonMistake}`}
              </p>
            </div>
          </div>

          <div className="mt-4">
            <h4 className="font-display text-xl font-bold text-[#F7F5FC]">
              {currentSpec.title}
            </h4>

            <ul className="mt-3 space-y-2 text-sm leading-relaxed text-[#E5DDF5]">
              {currentSpec.keyPoints.map((pt, i) => (
                <li key={i} className="flex items-start gap-2.5">
                  <span className="font-mono-data mt-0.5 text-xs font-bold text-[#26B9D1]">
                    0{i + 1}.
                  </span>
                  <span>{pt}</span>
                </li>
              ))}
            </ul>

            <div className="mt-4 rounded-xl border border-[#FFC94A]/30 bg-[#FFC94A]/10 p-3.5 text-xs leading-relaxed text-[#FFE8A3]">
              <span className="font-semibold text-[#FFC94A]">Perkara yang perlu dielakkan: </span>
              {currentSpec.commonMistake}
            </div>
          </div>
        </div>

        <div className="flex items-start gap-3 rounded-xl border border-white/15 bg-[#1B0E3B]/90 p-3.5">
          <div className="h-11 w-10 shrink-0 overflow-hidden rounded-lg border border-[#26B9D1]/40 bg-[#281653] pt-0.5">
            <img
              src={currentSpec.guideAgent === 'aya' ? ASSETS.ayaPortrait : ASSETS.arifPortrait}
              alt={currentSpec.guideAgent === 'aya' ? 'Aya Ejen Analisis' : 'Arif Ejen Kemahiran'}
              referrerPolicy="no-referrer"
              className="h-full w-full object-contain object-top"
            />
          </div>
          <div className="text-xs leading-relaxed text-[#E5DDF5]">
            <div className="font-bold text-[#26B9D1]">
              {currentSpec.guideAgent === 'aya'
                ? 'Aya · Ejen Analisis'
                : 'Arif · Ejen Kemahiran'}
            </div>
            <p className="mt-0.5">{currentSpec.guideNote}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
