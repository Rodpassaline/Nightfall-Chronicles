import { useEffect, useState, useCallback, useRef } from "react";
import {
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  ChevronRight,
  ChevronLeft,
} from "lucide-react";
import { sound } from "@/game/audio";

interface PrologueScreenProps {
  onFinish: () => void;
  muted: boolean;
  onToggleMute: () => void;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  hideFullscreenButton?: boolean;
}

interface StoryBeat {
  id: number;
  badge: string;
  badgeIcon: "moon" | "skull" | "sword" | "gate";
  title: string;
  subtitle: string;
  paragraphs: string[];
  accentBorder: string;
  voiceSrc: string;
  sfx?: () => void;
  durationMs: number;
}

const STORY_BEATS: StoryBeat[] = [
  {
    id: 0,
    badge: "ANO DE 1792 · O ECLIPSE CARMESIM",
    badgeIcon: "moon",
    title: "A NOITE ETERNA DESPERTA",
    subtitle: "A profecia de sangue se cumpre sobre a Transilvânia",
    paragraphs: [
      "A cada cem anos, quando as estrelas se alinham sob a lua de sangue, os portões do Castelo das Sombras rasgam os céus da Transilvânia.",
      "Das profundezas do abismo ancestral, Conde Drácula desperta mais uma vez com sede de vingança e poder eterno.",
    ],
    accentBorder: "border-red-600/70 text-red-500",
    voiceSrc: "/audio/prologue/act1.wav",
    durationMs: 17500,
    sfx: () => {
      sound.playSfx("bell");
    },
  },
  {
    id: 1,
    badge: "A GUARDA DO TRIBUNAL DAS SOMBRAS",
    badgeIcon: "skull",
    title: "OS SETE MESTRES DO ABISMO",
    subtitle: "Sete generais protegem o coração do castelo",
    paragraphs: [
      "Para deter qualquer invasão dos mortais, o Senhor Supremo convocou seus generais mais impiedosos.",
      "Titãs de pedra, lâminas de sangue e abominações alquímicas selaram cada um dos portões com feitiçaria proibida. Nenhum guerreiro comum jamais sobreviveu.",
    ],
    accentBorder: "border-purple-500/70 text-purple-400",
    voiceSrc: "/audio/prologue/act2.wav",
    durationMs: 15500,
    sfx: () => {
      sound.playSfx("spell");
    },
  },
  {
    id: 2,
    badge: "O ÚLTIMO DOS CAÇADORES",
    badgeIcon: "sword",
    title: "ALDRIC VALE",
    subtitle: "A última lâmina entre o mundo e a condenação",
    paragraphs: [
      "Com a Ordem Sagrada destruída nas fronteiras, resta apenas Aldric Vale.",
      "Empunhando a lâmina ancestral e a centelha do fogo arcano herdada de seus antepassados, ele caminha sozinho em direção ao castelo.",
    ],
    accentBorder: "border-gold/70 text-gold",
    voiceSrc: "/audio/prologue/act3.wav",
    durationMs: 12800,
    sfx: () => {
      sound.playSfx("slashHeavy");
      setTimeout(() => sound.playSfx("thunder"), 200);
    },
  },
  {
    id: 3,
    badge: "FASE 1 · O CEMITÉRIO DOS ESQUECIDOS",
    badgeIcon: "gate",
    title: "OS PORTÕES DA MORTE",
    subtitle: "A batalha pela humanidade começa agora",
    paragraphs: [
      "A névoa gelada se fecha atrás de você. Os portões de ferro batem com violência. Não há recuo.",
      "Destrua os sete mestres, quebre os selos amaldiçoados e liberte a noite!",
    ],
    accentBorder: "border-cyan-400/70 text-cyan-300",
    voiceSrc: "/audio/prologue/act4.wav",
    durationMs: 14000,
    sfx: () => {
      sound.playSfx("gateOpen");
      setTimeout(() => sound.playSfx("thunder"), 300);
    },
  },
];

export function PrologueScreen({
  onFinish,
  muted,
  onToggleMute,
  isFullscreen,
  onToggleFullscreen,
  hideFullscreenButton = false,
}: PrologueScreenProps) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [isFlashing, setIsFlashing] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [progressPercent, setProgressPercent] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const voiceAudioRef = useRef<HTMLAudioElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const beat = STORY_BEATS[currentIdx];

  // Sincroniza áudio do elemento de vídeo com estado muted
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = muted;
      videoRef.current.volume = 0.25; // Volume de fundo suave para destacar a narração
    }
  }, [muted]);

  // Reproduz a voz narrada do ato atual com clareza
  useEffect(() => {
    if (voiceAudioRef.current) {
      voiceAudioRef.current.pause();
      voiceAudioRef.current.currentTime = 0;
    }

    const audio = new Audio(beat.voiceSrc);
    audio.muted = muted;
    audio.volume = 1.0;
    voiceAudioRef.current = audio;

    const playPromise = audio.play();
    if (playPromise !== undefined) {
      playPromise.catch((err) => {
        console.warn("Voz narrada bloqueada pelo navegador:", err);
      });
    }

    return () => {
      audio.pause();
      audio.currentTime = 0;
    };
  }, [currentIdx, muted, beat.voiceSrc]);

  // Sincroniza estado de mudo com a voz
  useEffect(() => {
    if (voiceAudioRef.current) {
      voiceAudioRef.current.muted = muted;
    }
  }, [muted]);

  // Efeito de som e relâmpago ao mudar de ato
  useEffect(() => {
    beat.sfx?.();
    if (currentIdx === 0 || currentIdx === 2 || currentIdx === 3) {
      setIsFlashing(true);
      const timer = setTimeout(() => setIsFlashing(false), 220);
      return () => clearTimeout(timer);
    }
  }, [currentIdx]);

  const stopVoice = useCallback(() => {
    if (voiceAudioRef.current) {
      voiceAudioRef.current.pause();
      voiceAudioRef.current.currentTime = 0;
    }
  }, []);

  const handleFinish = useCallback(() => {
    stopVoice();
    sound.playSfx("gateOpen");
    onFinish();
  }, [stopVoice, onFinish]);

  const goToNext = useCallback(() => {
    if (isTransitioning) return;
    if (currentIdx < STORY_BEATS.length - 1) {
      setIsTransitioning(true);
      stopVoice();
      setTimeout(() => {
        setCurrentIdx((prev) => prev + 1);
        setIsTransitioning(false);
      }, 200);
    } else {
      // Final do prólogo: toca o portão e entra na Fase 1
      handleFinish();
    }
  }, [currentIdx, isTransitioning, stopVoice, handleFinish]);

  const goToPrev = useCallback(() => {
    if (isTransitioning || currentIdx <= 0) return;
    setIsTransitioning(true);
    stopVoice();
    setTimeout(() => {
      setCurrentIdx((prev) => prev - 1);
      setIsTransitioning(false);
    }, 200);
  }, [currentIdx, isTransitioning, stopVoice]);

  // Avanço automático contínuo com barra de progresso (estilo cinema)
  useEffect(() => {
    const startTime = Date.now();
    const duration = beat.durationMs;

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const pct = Math.min(100, (elapsed / duration) * 100);
      setProgressPercent(pct);

      if (elapsed >= duration) {
        clearInterval(interval);
        goToNext();
      }
    }, 50);

    return () => clearInterval(interval);
  }, [currentIdx, beat.durationMs, goToNext]);

  // Teclado: Espaço / Enter para avançar, Esc para pular
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        handleFinish();
      } else if (e.key === " " || e.key === "Enter" || e.key === "ArrowRight") {
        e.preventDefault();
        goToNext();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        goToPrev();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [goToNext, goToPrev, handleFinish]);

  // Efeito de partículas de cinzas / brasas flutuantes no canvas sobreposto
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const onResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", onResize);

    const particles = Array.from({ length: 40 }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      size: Math.random() * 2.2 + 0.6,
      speedY: -(Math.random() * 0.6 + 0.25),
      speedX: (Math.random() - 0.5) * 0.4,
      opacity: Math.random() * 0.6 + 0.25,
      isEmber: Math.random() > 0.4,
    }));

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      for (const p of particles) {
        p.y += p.speedY;
        p.x += p.speedX;

        if (p.y < -10) {
          p.y = height + 10;
          p.x = Math.random() * width;
        }
        if (p.x < -10) p.x = width + 10;
        if (p.x > width + 10) p.x = -10;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        if (p.isEmber) {
          ctx.fillStyle = `rgba(235, 70, 45, ${p.opacity * 0.85})`;
          ctx.shadowColor = "rgba(255, 90, 50, 0.9)";
          ctx.shadowBlur = 4;
        } else {
          ctx.fillStyle = `rgba(220, 200, 160, ${p.opacity * 0.5})`;
          ctx.shadowBlur = 0;
        }
        ctx.fill();
      }

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-between bg-black text-white select-none overflow-hidden">
      {/* 1. HD Animated Background Video */}
      <div className="absolute inset-0 z-0 overflow-hidden flex items-center justify-center bg-black">
        <video
          ref={videoRef}
          src="/video/intro.mp4"
          playsInline
          autoPlay
          loop
          onEnded={handleFinish}
          onError={() => {
            console.warn("Vídeo não carregado, usando modo fallback visual");
          }}
          className="h-full w-full object-cover transition-opacity duration-700"
        />

        {/* Subtle cinematic vignette at top and bottom to keep controls legible without darkening the video */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/60 pointer-events-none" />
      </div>

      {/* 2. Floating Fire Embers Canvas */}
      <canvas
        ref={canvasRef}
        className="pointer-events-none absolute inset-0 z-10 opacity-50"
      />

      {/* 3. Dynamic Lightning Flash */}
      <div
        className={`pointer-events-none absolute inset-0 z-20 bg-white transition-opacity duration-200 ${
          isFlashing ? "opacity-35" : "opacity-0"
        }`}
      />

      {/* 4. Top Header & Cinematic Controls */}
      <header className="relative z-30 flex items-center justify-between px-4 sm:px-8 py-3.5 sm:py-4 bg-gradient-to-b from-black/80 via-black/40 to-transparent">
        <div className="flex items-center gap-2.5">
          <div className="h-2 w-2 rounded-full bg-blood animate-pulse shadow-[0_0_8px_rgba(220,38,38,0.9)]" />
          <span className="font-display text-xs sm:text-sm tracking-widest text-gold uppercase drop-shadow-[0_2px_4px_rgba(0,0,0,1)]">
            Nightfall Chronicles · Prólogo
          </span>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {/* Fullscreen Button (Desktop only) */}
          {!hideFullscreenButton ? (
            <button
              type="button"
              className="inline-flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center border border-line bg-black/70 backdrop-blur-sm font-display text-xs text-fg hover:border-gold rounded transition-all cursor-pointer shadow-md"
              onClick={onToggleFullscreen}
              title={isFullscreen ? "Sair da Tela Cheia" : "Tela Cheia"}
            >
              {isFullscreen ? (
                <Minimize2 className="h-4 w-4 text-gold" />
              ) : (
                <Maximize2 className="h-4 w-4 text-gold" />
              )}
            </button>
          ) : null}

          {/* Audio Button */}
          <button
            type="button"
            className="inline-flex h-8 sm:h-9 items-center gap-2 border border-line bg-black/70 backdrop-blur-sm px-3 font-display text-xs tracking-widest text-fg hover:border-gold rounded transition-all cursor-pointer shadow-md"
            onClick={onToggleMute}
            title={muted ? "Ativar Áudio" : "Mutar Áudio"}
          >
            {muted ? (
              <VolumeX className="h-4 w-4 text-blood" />
            ) : (
              <Volume2 className="h-4 w-4 text-gold" />
            )}
            <span className="hidden md:inline">{muted ? "Mudo" : "Som"}</span>
          </button>

          {/* Skip Button */}
          <button
            type="button"
            className="inline-flex h-8 sm:h-9 items-center gap-1.5 border border-gold/60 bg-blood/85 hover:bg-blood backdrop-blur-sm px-3.5 font-display text-xs tracking-widest text-fg rounded shadow-[0_0_12px_rgba(180,35,48,0.4)] transition-all cursor-pointer hover:scale-105 active:scale-95"
            onClick={handleFinish}
          >
            <span>Pular</span>
            <span className="text-[10px] text-fg/70 hidden sm:inline">[ESC]</span>
          </button>
        </div>
      </header>

      {/* 5. Center Space: Left completely empty and unobstructed so the video and voiceover shine */}
      <div className="flex-1 pointer-events-none" />

      {/* 6. Bottom Bar: Progress Bar & Cinematic Navigation */}
      <footer className="relative z-30 flex flex-col gap-2.5 px-4 sm:px-8 py-3 bg-gradient-to-t from-black/80 via-black/40 to-transparent">
        {/* Subtle Chapter Progress Line */}
        <div className="h-1 w-full rounded-full bg-white/10 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-blood via-gold to-white transition-all duration-75"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        <div className="flex items-center justify-between">
          {/* Act Dots */}
          <div className="flex items-center gap-2">
            {STORY_BEATS.map((b, idx) => (
              <button
                key={b.id}
                type="button"
                onClick={() => setCurrentIdx(idx)}
                className={`h-2 transition-all rounded-full cursor-pointer ${
                  idx === currentIdx
                    ? "w-7 bg-gold shadow-[0_0_8px_rgba(255,215,0,0.8)]"
                    : idx < currentIdx
                    ? "w-2 bg-blood"
                    : "w-2 bg-white/20 hover:bg-white/40"
                }`}
                title={`Ato ${idx + 1}`}
              />
            ))}
            <span className="ml-2 font-display text-[11px] text-gold/80 tracking-widest">
              Ato {currentIdx + 1} de {STORY_BEATS.length}
            </span>
          </div>

          {/* Navigation Controls */}
          <div className="flex items-center gap-2 sm:gap-3">
            {currentIdx > 0 && (
              <button
                type="button"
                className="inline-flex h-9 items-center gap-1 border border-line bg-black/80 hover:border-gold px-3 font-display text-xs tracking-widest text-fg rounded transition-all cursor-pointer"
                onClick={goToPrev}
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Anterior</span>
              </button>
            )}

            <button
              type="button"
              className="inline-flex h-9 items-center gap-1.5 border border-gold/70 bg-blood px-4 font-display text-xs tracking-widest text-fg hover:brightness-110 active:scale-95 rounded shadow-[0_0_12px_rgba(180,35,48,0.4)] transition-all cursor-pointer"
              onClick={goToNext}
            >
              <span>
                {currentIdx === STORY_BEATS.length - 1 ? "Entrar no Castelo" : "Avançar"}
              </span>
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
