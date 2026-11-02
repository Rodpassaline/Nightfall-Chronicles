import React, { useEffect, useState } from "react";
import type { BossCinematicInfo } from "@/game/campaign";
import { Volume2, FastForward, Swords } from "lucide-react";

interface BossCinematicOverlayProps {
  cinematic: BossCinematicInfo;
  onSkip: () => void;
}

export function BossCinematicOverlay({ cinematic, onSkip }: BossCinematicOverlayProps) {
  const [canSkip, setCanSkip] = useState(false);

  // Require at least 0.6s before skip can be pressed to avoid accidental triggers
  useEffect(() => {
    const t = setTimeout(() => {
      setCanSkip(true);
    }, 600);
    return () => clearTimeout(t);
  }, []);

  // Keyboard space / enter / escape to skip
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

  const displayedText = cinematic.quote.slice(0, cinematic.charCount || cinematic.quote.length);
  const themeColor = cinematic.themeColor || "#ffd700";

  // Use rock-solid image: Idle bust during speech (ZERO flicker/pisca-pisca!), Roar bust during roar_out
  const bustSrc =
    cinematic.phase === "roar_out"
      ? cinematic.bustTalk || cinematic.bustIdle || cinematic.portrait
      : cinematic.bustIdle || cinematic.portrait;

  return (
    <div
      role="dialog"
      aria-label={`Apresentação do Chefe: ${cinematic.speaker}`}
      className="fixed inset-0 z-40 pointer-events-none select-none flex flex-col justify-between overflow-hidden"
    >
      {/* =========================================================================
          1. EPIC MASTERWORK BOSS ARTWORK IN CINEMATIC FOCUS (NO BORDERS, SEAMLESS FADE)
          Dark gothic oil painting with radial feathering and breathing animation
      ========================================================================= */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden pb-12 sm:pb-16">
        {/* Thematic atmospheric color glow behind the boss */}
        <div
          className="absolute w-[320px] h-[320px] sm:w-[460px] sm:h-[460px] rounded-full blur-3xl opacity-25 pointer-events-none transition-opacity duration-1000"
          style={{ backgroundColor: themeColor }}
        />

        {/* Ambient Dark Gothic Vignette Backdrop */}
        <div className="absolute inset-0 bg-radial-[ellipse_at_center,_transparent_25%,_rgba(0,0,0,0.92)_85%] pointer-events-none" />

        {/* Boss Bust Image Container with Soft Radial Edge Dissolve */}
        <div
          className={`relative flex items-center justify-center transition-all duration-500 ease-out ${
            cinematic.phase === "roar_out"
              ? "scale-110 brightness-125 filter drop-shadow-[0_0_45px_rgba(255,23,68,0.95)]"
              : "scale-100 brightness-100 filter drop-shadow-[0_0_30px_rgba(0,0,0,0.95)]"
          }`}
          style={{
            maxWidth: "96vw",
            maxHeight: "75vh",
          }}
        >
          <img
            src={bustSrc}
            alt={cinematic.speaker}
            className="w-auto h-[250px] xs:h-[290px] sm:h-[380px] md:h-[460px] max-w-none object-contain select-none pointer-events-none animate-boss-breathe"
            style={{
              // Radial mask dissolves all 4 rectangular borders seamlessly into the dark atmosphere
              WebkitMaskImage: "radial-gradient(ellipse 70% 75% at 50% 45%, black 45%, transparent 92%)",
              maskImage: "radial-gradient(ellipse 70% 75% at 50% 45%, black 45%, transparent 92%)",
            }}
          />

          {/* Smooth bottom gradient falloff so lower torso softly blends with subtitle */}
          <div className="absolute inset-x-0 bottom-0 h-24 sm:h-36 bg-gradient-to-t from-black via-black/70 to-transparent pointer-events-none" />
        </div>
      </div>

      {/* =========================================================================
          2. TOP HEADER (DISCREET & CLEAN)
      ========================================================================= */}
      <div className="relative z-20 flex items-center justify-between px-3 pt-2.5 sm:px-6 sm:pt-4">
        {/* Subtle Encounter Badge */}
        <div className="bg-black/75 backdrop-blur-md border border-gold/40 px-3 py-1 rounded-full shadow-lg flex items-center gap-1.5 pointer-events-none">
          <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-ping" />
          <span className="font-display text-[9px] sm:text-[10.5px] text-gold font-bold tracking-widest uppercase">
            FASE {cinematic.stageId} · {cinematic.speaker}
          </span>
        </div>

        {/* Discreet Skip Button (Top Right) */}
        {cinematic.phase === "speaking" && canSkip ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onSkip();
            }}
            className="pointer-events-auto flex items-center gap-1.5 bg-black/80 hover:bg-black/95 active:scale-95 border border-gold/50 hover:border-gold px-3 py-1 rounded-full text-gold hover:text-white shadow-xl transition-all duration-150 cursor-pointer"
            title="Pular apresentação do chefe"
          >
            <FastForward className="h-3 w-3 text-gold" />
            <span className="font-display text-[8.5px] sm:text-[9.5px] font-bold tracking-wider uppercase">
              PULAR [TOQUE]
            </span>
          </button>
        ) : null}
      </div>

      {/* =========================================================================
          3. CENTER BATTLE START SPLASH (Shown during roar_out phase)
      ========================================================================= */}
      {cinematic.phase === "roar_out" ? (
        <div className="relative z-30 my-auto mx-auto text-center pointer-events-none animate-zoomIn px-4">
          <div className="bg-black/90 backdrop-blur-md border-2 border-blood px-7 py-4 sm:px-10 sm:py-5 rounded-lg shadow-[0_0_40px_rgba(225,29,72,0.95)] max-w-md mx-auto">
            <div className="flex items-center justify-center gap-2 text-gold mb-1">
              <Swords className="h-6 w-6 animate-pulse text-gold" />
              <p className="font-display text-lg sm:text-2xl text-gold font-extrabold tracking-widest uppercase">
                A BATALHA COMEÇOU!
              </p>
              <Swords className="h-6 w-6 animate-pulse text-gold" />
            </div>
            <p className="font-display text-xs sm:text-sm text-red-200 font-bold tracking-wider uppercase">
              Derrote {cinematic.speaker}!
            </p>
          </div>
        </div>
      ) : (
        <div className="my-auto" />
      )}

      {/* =========================================================================
          4. MINIMALIST CINEMATIC SUBTITLE (SLENDER STRIP AT BOTTOM — NO GIANT CARD!)
      ========================================================================= */}
      {cinematic.phase === "speaking" ? (
        <div className="relative z-20 pointer-events-auto mx-auto w-full max-w-xl px-3 pb-3 sm:pb-5 text-center">
          {/* Subtle translucent cinematic bar with gold accent */}
          <div
            className="bg-black/85 backdrop-blur-md border border-gold/45 rounded-md px-3 py-2 sm:px-5 sm:py-2.5 shadow-[0_6px_28px_rgba(0,0,0,0.9)] cursor-default"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Speaker Name with Audio Voice Pulse */}
            <div className="flex items-center justify-center gap-1.5 mb-0.5">
              <Volume2 className="h-3 w-3 text-gold animate-pulse shrink-0" />
              <span className="font-display text-xs sm:text-sm font-extrabold text-gold tracking-widest uppercase">
                {cinematic.speaker}
              </span>
              <span className="text-[10px] sm:text-xs text-red-300 font-medium tracking-wide">
                · {cinematic.title.split("·")[0].trim()}
              </span>
            </div>

            {/* Spoken Quote with Typewriter Cursor */}
            <p className="font-serif italic text-xs sm:text-[13.5px] text-fg leading-relaxed">
              « {displayedText} »
              {cinematic.charCount < cinematic.quote.length ? (
                <span className="inline-block w-1.5 h-3 bg-gold animate-pulse ml-0.5 align-middle" />
              ) : null}
            </p>
          </div>
        </div>
      ) : (
        <div className="h-4" />
      )}
    </div>
  );
}
