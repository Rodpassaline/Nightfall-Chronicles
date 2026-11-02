import React, { useEffect } from "react";
import type { BossCinematicInfo } from "@/game/campaign";
import { Volume2, FastForward, Swords } from "lucide-react";

interface BossCinematicOverlayProps {
  cinematic: BossCinematicInfo;
  onSkip: () => void;
}

export function BossCinematicOverlay({ cinematic, onSkip }: BossCinematicOverlayProps) {
  // Listen to keyboard space / enter to skip
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (cinematic.phase === "speaking") {
        if (e.code === "Space" || e.code === "Enter" || e.code === "KeyZ" || e.code === "KeyX") {
          e.preventDefault();
          e.stopPropagation();
          onSkip();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [cinematic.phase, onSkip]);

  const displayedText = cinematic.quote.slice(0, cinematic.charCount);
  const progressRatio = Math.min(1, cinematic.timer / Math.max(1, cinematic.duration));

  return (
    <div
      role="dialog"
      aria-label={`Encontro Cinematográfico: ${cinematic.speaker}`}
      className="fixed inset-0 z-40 pointer-events-auto select-none flex flex-col justify-between p-3 sm:p-6 overflow-hidden cursor-pointer"
      onClick={onSkip}
      onTouchStart={onSkip}
    >
      {/* Top Dramatic Encounter Header */}
      <div className="flex justify-center mt-1 sm:mt-2 pointer-events-none animate-fadeIn">
        <div className="bg-black/90 backdrop-blur-md border border-gold/60 px-3.5 py-1 rounded-full shadow-[0_0_18px_rgba(212,175,55,0.45)] flex items-center gap-2">
          <span className="text-red-500 font-extrabold text-xs">✦</span>
          <span className="font-display text-[10px] sm:text-xs text-gold font-bold tracking-widest uppercase">
            Salão do Mestre · Fase {cinematic.stageId}
          </span>
          <span className="text-red-500 font-extrabold text-xs">✦</span>
        </div>
      </div>

      {/* Center Roar Out / Battle Start Splash (shown during roar_out phase) */}
      {cinematic.phase === "roar_out" ? (
        <div className="my-auto mx-auto text-center pointer-events-none animate-zoomIn">
          <div className="bg-black/85 backdrop-blur-md border-2 border-blood px-6 py-4 rounded-lg shadow-[0_0_35px_rgba(225,29,72,0.85)] max-w-md mx-auto">
            <div className="flex items-center justify-center gap-2 text-gold mb-1">
              <Swords className="h-6 w-6 animate-pulse text-gold" />
              <p className="font-display text-lg sm:text-2xl text-gold font-extrabold tracking-widest uppercase">
                A Batalha Começou!
              </p>
              <Swords className="h-6 w-6 animate-pulse text-gold" />
            </div>
            <p className="font-display text-xs sm:text-sm text-red-300 font-bold tracking-wider mt-1">
              Derrote {cinematic.speaker.toUpperCase()}!
            </p>
          </div>
        </div>
      ) : (
        <div className="my-auto" />
      )}

      {/* Bottom Castlevania SOTN Gothic Dialogue Box (Active during speaking phase) */}
      {cinematic.phase === "speaking" ? (
        <div
          className="mx-auto w-[95%] sm:w-full max-w-2xl bg-black/95 backdrop-blur-md border-2 border-gold/75 rounded-lg p-3 sm:p-4 shadow-[0_0_35px_rgba(0,0,0,0.95),inset_0_0_15px_rgba(180,35,48,0.25)] relative mb-2 sm:mb-4 animate-slideUp cursor-default"
          onClick={(e) => {
            e.stopPropagation();
            onSkip();
          }}
          onTouchStart={(e) => {
            e.stopPropagation();
            onSkip();
          }}
        >
          {/* Ornate Gold Corner Sigils */}
          <span className="absolute top-1 left-1.5 text-gold/60 text-[9px] pointer-events-none">❖</span>
          <span className="absolute top-1 right-1.5 text-gold/60 text-[9px] pointer-events-none">❖</span>
          <span className="absolute bottom-1 left-1.5 text-gold/60 text-[9px] pointer-events-none">❖</span>
          <span className="absolute bottom-1 right-1.5 text-gold/60 text-[9px] pointer-events-none">❖</span>

          <div className="flex items-center gap-3 sm:gap-4">
            {/* Left: Boss Portrait in Ornate Gothic Frame */}
            <div className="relative w-14 h-14 sm:w-18 sm:h-18 shrink-0 rounded border-2 border-gold shadow-[0_0_12px_rgba(212,175,55,0.7)] overflow-hidden bg-black">
              <img
                src={cinematic.portrait}
                alt={cinematic.speaker}
                className="w-full h-full object-cover object-center transform scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
            </div>

            {/* Right: Speaker Title & Animated Typed Spoken Quote */}
            <div className="flex-1 min-w-0 flex flex-col justify-center">
              <div className="flex items-center justify-between gap-2 border-b border-gold/30 pb-1">
                <div className="flex flex-col min-w-0">
                  <span className="font-display text-xs sm:text-sm font-extrabold text-gold tracking-widest uppercase truncate">
                    {cinematic.speaker}
                  </span>
                  <span className="text-[9px] sm:text-[10px] text-red-300/90 font-medium tracking-wide truncate">
                    {cinematic.title}
                  </span>
                </div>
                <div className="flex items-center gap-1 shrink-0 bg-blood/30 border border-gold/40 px-1.5 py-0.5 rounded">
                  <Volume2 className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-gold animate-pulse" />
                  <span className="text-[8px] font-display text-gold tracking-wider font-bold">VOZ</span>
                </div>
              </div>

              {/* Spoken Quote with Animated Blinking Cursor */}
              <div className="mt-1.5 sm:mt-2 min-h-[38px] sm:min-h-[46px] flex items-start">
                <p className="font-serif italic text-xs sm:text-sm text-fg/95 leading-snug sm:leading-relaxed">
                  "{displayedText}"
                  {cinematic.charCount < cinematic.quote.length ? (
                    <span className="inline-block w-1.5 h-3 bg-gold animate-pulse ml-0.5 align-middle" />
                  ) : null}
                </p>
              </div>

              {/* Skip Hint / Button */}
              <div className="mt-1 flex items-center justify-between text-[9px] sm:text-[10px] text-muted">
                <span className="hidden xs:inline text-gold/70">
                  A batalha começará após a fala...
                </span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSkip();
                  }}
                  className="ml-auto flex items-center gap-1 bg-surface-2/90 border border-gold/50 px-2 py-0.5 rounded text-gold hover:text-white hover:bg-gold/25 active:scale-95 transition cursor-pointer"
                  title="Pular diálogo e iniciar a batalha agora"
                >
                  <FastForward className="h-3 w-3" />
                  <span className="font-display font-bold tracking-wider">PULAR (TOQUE / ESPAÇO)</span>
                </button>
              </div>
            </div>
          </div>

          {/* Bottom Speech Timer Progress Bar */}
          <div className="absolute -bottom-[2px] left-2 right-2 h-[2px] bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-red-600 via-rose-500 to-amber-300 transition-all duration-100"
              style={{ width: `${progressRatio * 100}%` }}
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}
