import React, { useEffect, useState } from "react";
import type { BossCinematicInfo } from "@/game/campaign";
import { Volume2, FastForward, Swords, ShieldAlert, Sparkles } from "lucide-react";

interface BossCinematicOverlayProps {
  cinematic: BossCinematicInfo;
  onSkip: () => void;
}

export function BossCinematicOverlay({ cinematic, onSkip }: BossCinematicOverlayProps) {
  const [canSkip, setCanSkip] = useState(false);
  const [talkMouth, setTalkMouth] = useState(false);

  // Require at least 0.8s before skip can be pressed to avoid accidental triggers from walking into the arena
  useEffect(() => {
    const t = setTimeout(() => {
      setCanSkip(true);
    }, 800);
    return () => clearTimeout(t);
  }, []);

  // Keyboard space / enter / escape to skip (only after canSkip is true)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (cinematic.phase === "speaking" && canSkip) {
        if (e.code === "Space" || e.code === "Enter" || e.code === "Escape") {
          e.preventDefault();
          e.stopPropagation();
          onSkip();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [cinematic.phase, canSkip, onSkip]);

  // Speaking animation: alternate mouth open / mouth closed in rhythm with speech
  useEffect(() => {
    if (cinematic.phase === "roar_out") {
      setTalkMouth(true);
      return;
    }
    if (cinematic.phase !== "speaking") {
      setTalkMouth(false);
      return;
    }

    // While typing the quote, animate mouth flapping naturally (180ms cadence)
    const isTyping = cinematic.charCount < cinematic.quote.length;
    if (!isTyping) {
      setTalkMouth(false);
      return;
    }

    const interval = setInterval(() => {
      setTalkMouth((prev) => !prev);
    }, 180);

    return () => clearInterval(interval);
  }, [cinematic.phase, cinematic.charCount, cinematic.quote.length]);

  const displayedText = cinematic.quote.slice(0, cinematic.charCount || cinematic.quote.length);
  const progressRatio = Math.min(1, cinematic.timer / Math.max(1, cinematic.duration));

  // Determine current active background bust sprite
  const activeBustSrc =
    cinematic.phase === "roar_out"
      ? cinematic.bustTalk || cinematic.bustIdle || cinematic.portrait
      : talkMouth && cinematic.bustTalk
      ? cinematic.bustTalk
      : cinematic.bustIdle || cinematic.portrait;

  const themeColor = cinematic.themeColor || "#ffd700";

  return (
    <div
      role="dialog"
      aria-label={`Confronto Cinematográfico: ${cinematic.speaker}`}
      className="fixed inset-0 z-40 pointer-events-none select-none flex flex-col justify-between p-3 sm:p-6 overflow-hidden"
    >
      {/* =========================================================================
          1. DRAMATIC BOSS BACKGROUND BUST / FACE PRESENTATION ("COMO SE ESTIVESSE FALANDO")
          Towering portrait in the background with animated mouth & aura pulse
      ========================================================================= */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
        {/* Thematic dark atmospheric radial aura glow behind the boss */}
        <div
          className="absolute w-[320px] h-[320px] sm:w-[480px] sm:h-[480px] rounded-full blur-3xl opacity-35 transition-all duration-300 pointer-events-none"
          style={{
            backgroundColor: themeColor,
            transform: talkMouth ? "scale(1.15)" : "scale(1.0)",
          }}
        />

        {/* Ambient Dark Gothic Shadow Backdrop */}
        <div className="absolute inset-0 bg-radial-[ellipse_at_center,_transparent_20%,_rgba(0,0,0,0.85)_80%] pointer-events-none" />

        {/* Boss Bust Image Container */}
        <div
          className={`relative flex items-center justify-center transition-all duration-150 ${
            cinematic.phase === "roar_out"
              ? "scale-110 sm:scale-125 brightness-125 filter drop-shadow-[0_0_35px_rgba(255,23,68,0.9)] animate-pulse"
              : talkMouth
              ? "scale-[1.03] -translate-y-1 brightness-110 filter drop-shadow-[0_0_25px_rgba(212,175,55,0.7)]"
              : "scale-100 translate-y-0 brightness-95 filter drop-shadow-[0_0_15px_rgba(0,0,0,0.9)]"
          }`}
          style={{
            maxWidth: "92vw",
            maxHeight: "75vh",
          }}
        >
          {/* Main Boss Bust Sprite */}
          <img
            src={activeBustSrc}
            alt={cinematic.speaker}
            className="w-auto h-[260px] xs:h-[300px] sm:h-[390px] md:h-[440px] max-w-none object-contain select-none pointer-events-none"
            style={{
              imageRendering: "auto",
            }}
          />

          {/* Smooth bottom gradient falloff so the bust blends into darkness & dialogue box */}
          <div className="absolute inset-x-0 bottom-0 h-32 sm:h-44 bg-gradient-to-t from-black via-black/80 to-transparent pointer-events-none" />

          {/* Side subtle vignette shadows */}
          <div className="absolute inset-y-0 left-0 w-16 sm:w-24 bg-gradient-to-r from-black/80 to-transparent pointer-events-none" />
          <div className="absolute inset-y-0 right-0 w-16 sm:w-24 bg-gradient-to-l from-black/80 to-transparent pointer-events-none" />
        </div>
      </div>

      {/* =========================================================================
          2. TOP DRAMATIC ENCOUNTER BADGE
      ========================================================================= */}
      <div className="relative z-10 flex justify-center mt-1 pointer-events-none animate-fadeIn">
        <div className="bg-black/92 backdrop-blur-md border border-gold/70 px-4 py-1.5 rounded-full shadow-[0_0_22px_rgba(212,175,55,0.6)] flex items-center gap-2.5">
          <ShieldAlert className="h-4 w-4 text-red-500 animate-pulse" />
          <span className="font-display text-[11px] sm:text-xs text-gold font-bold tracking-widest uppercase">
            ENCONTRO COM O CHEFE · FASE {cinematic.stageId}
          </span>
          <ShieldAlert className="h-4 w-4 text-red-500 animate-pulse" />
        </div>
      </div>

      {/* =========================================================================
          3. CENTER BATTLE START SPLASH (Shown during roar_out phase)
      ========================================================================= */}
      {cinematic.phase === "roar_out" ? (
        <div className="relative z-10 my-auto mx-auto text-center pointer-events-none animate-zoomIn">
          <div className="bg-black/92 backdrop-blur-md border-2 border-blood px-8 py-5 rounded-lg shadow-[0_0_40px_rgba(225,29,72,0.95)] max-w-lg mx-auto">
            <div className="flex items-center justify-center gap-2 text-gold mb-1.5">
              <Swords className="h-7 w-7 animate-pulse text-gold" />
              <p className="font-display text-xl sm:text-3xl text-gold font-extrabold tracking-widest uppercase">
                A BATALHA COMEÇOU!
              </p>
              <Swords className="h-7 w-7 animate-pulse text-gold" />
            </div>
            <p className="font-display text-xs sm:text-sm text-red-200 font-bold tracking-wider mt-1 uppercase">
              Derrote {cinematic.speaker}!
            </p>
          </div>
        </div>
      ) : (
        <div className="my-auto" />
      )}

      {/* =========================================================================
          4. BOTTOM CASTLEVANIA SOTN GOTHIC DIALOGUE BOX (Active during speaking phase)
      ========================================================================= */}
      {cinematic.phase === "speaking" ? (
        <div
          className="relative z-20 pointer-events-auto mx-auto w-[96%] sm:w-full max-w-2xl bg-black/95 backdrop-blur-md border-2 border-gold/80 rounded-lg p-3 sm:p-5 shadow-[0_0_45px_rgba(0,0,0,0.95),inset_0_0_20px_rgba(180,35,48,0.35)] mb-3 sm:mb-5 animate-slideUp cursor-default"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Ornate Gold Corner Sigils */}
          <span className="absolute top-1 left-1.5 text-gold/70 text-xs pointer-events-none">❖</span>
          <span className="absolute top-1 right-1.5 text-gold/70 text-xs pointer-events-none">❖</span>
          <span className="absolute bottom-1 left-1.5 text-gold/70 text-xs pointer-events-none">❖</span>
          <span className="absolute bottom-1 right-1.5 text-gold/70 text-xs pointer-events-none">❖</span>

          <div className="flex items-center gap-3 sm:gap-5">
            {/* Left: Boss Portrait in Ornate Gothic Frame */}
            <div className="relative w-16 h-16 sm:w-22 sm:h-22 shrink-0 rounded border-2 border-gold shadow-[0_0_16px_rgba(212,175,55,0.8)] overflow-hidden bg-black">
              <img
                src={activeBustSrc}
                alt={cinematic.speaker}
                className="w-full h-full object-cover object-top transform scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent pointer-events-none" />
              <div className="absolute bottom-0 inset-x-0 text-center py-0.5 bg-black/85 border-t border-gold/40">
                <span className="text-[7.5px] sm:text-[8.5px] font-display font-extrabold text-gold uppercase tracking-tighter">
                  CHEFE
                </span>
              </div>
            </div>

            {/* Right: Speaker Title & Animated Typed Spoken Quote */}
            <div className="flex-1 min-w-0 flex flex-col justify-center">
              <div className="flex items-center justify-between gap-2 border-b border-gold/40 pb-1.5">
                <div className="flex flex-col min-w-0">
                  <span className="font-display text-sm sm:text-base font-extrabold text-gold tracking-widest uppercase truncate">
                    {cinematic.speaker}
                  </span>
                  <span className="text-[10px] sm:text-xs text-red-300 font-medium tracking-wide truncate">
                    {cinematic.title}
                  </span>
                </div>
                <div
                  className="flex items-center gap-1.5 shrink-0 border px-2 py-0.5 rounded shadow"
                  style={{
                    backgroundColor: "rgba(180, 35, 48, 0.4)",
                    borderColor: themeColor,
                  }}
                >
                  <Volume2
                    className={`h-3.5 w-3.5 text-gold ${talkMouth ? "animate-bounce scale-110" : "animate-pulse"}`}
                  />
                  <span className="text-[8.5px] font-display text-gold tracking-wider font-bold">
                    {talkMouth ? "FALANDO" : "PRESENTE"}
                  </span>
                </div>
              </div>

              {/* Spoken Quote with Animated Blinking Cursor */}
              <div className="mt-2 sm:mt-2.5 min-h-[42px] sm:min-h-[50px] flex items-start">
                <p className="font-serif italic text-xs sm:text-sm text-fg leading-relaxed">
                  « {displayedText} »
                  {cinematic.charCount < cinematic.quote.length ? (
                    <span className="inline-block w-1.5 h-3.5 bg-gold animate-pulse ml-0.5 align-middle" />
                  ) : null}
                </p>
              </div>

              {/* Explicit Skip Button (Only clickable after 0.8s) */}
              <div className="mt-1.5 flex items-center justify-between text-[9px] sm:text-[10px]">
                <span className="hidden xs:inline text-gold/75 tracking-wide flex items-center gap-1">
                  <Sparkles className="h-3 w-3 text-gold/70" />
                  A luta começa logo após o discurso...
                </span>
                {canSkip ? (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSkip();
                    }}
                    className="ml-auto flex items-center gap-1.5 bg-surface-2/95 border-2 border-gold/80 px-2.5 py-1 rounded text-gold hover:text-white hover:bg-gold/30 active:scale-95 transition shadow-lg cursor-pointer"
                    title="Pular fala e iniciar o combate"
                  >
                    <FastForward className="h-3.5 w-3.5 text-gold" />
                    <span className="font-display font-bold tracking-wider text-[9px] sm:text-[10px]">
                      PULAR [ESPAÇO / TOQUE]
                    </span>
                  </button>
                ) : (
                  <span className="ml-auto text-muted text-[9px] italic">Aguardando introdução...</span>
                )}
              </div>
            </div>
          </div>

          {/* Bottom Speech Timer Progress Bar */}
          <div className="absolute -bottom-[2px] left-2 right-2 h-[2.5px] bg-white/10 rounded-full overflow-hidden">
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
