import { useEffect, useState, useCallback, useRef } from "react";
import {
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  Sword,
  ShieldAlert,
  Skull,
} from "lucide-react";
import { sound } from "@/game/audio";

interface PrologueScreenProps {
  onFinish: () => void;
  muted: boolean;
  onToggleMute: () => void;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
}

interface Scene {
  id: number;
  badge: string;
  badgeIcon: "moon" | "skull" | "sword" | "gate";
  title: string;
  subtitle: string;
  paragraphs: string[];
  bgImage: string;
  bgFocus: string;
  accentColor: string;
  sfxOnEnter?: () => void;
}

const SCENES: Scene[] = [
  {
    id: 0,
    badge: "ANO DE 1792 · O ECLIPSE CARMESIM",
    badgeIcon: "moon",
    title: "A NOITE ETERNA DESPERTA",
    subtitle: "A profecia de sangue se cumpre sobre a Transilvânia",
    paragraphs: [
      "A cada cem anos, quando as estrelas se alinham sob a lua de sangue, os portões do Castelo das Sombras rasgam os céus do reino.",
      "Das profundezas do abismo ancestral, Conde Drácula ergue-se mais uma vez de seu sono de sepulcro, espalhando uma praga de trevas sobre os vivos.",
    ],
    bgImage: "/art/stage-7.jpg",
    bgFocus: "center",
    accentColor: "border-blood text-blood",
    sfxOnEnter: () => {
      sound.playSfx("bell");
    },
  },
  {
    id: 1,
    badge: "A GUARDA DO TRIBUNAL DAS SOMBRAS",
    badgeIcon: "skull",
    title: "OS SETE MESTRES DO ABISMO",
    subtitle: "Nenhum mortal jamais sobreviveu aos seus julgamentos",
    paragraphs: [
      "Para proteger seu coração sombrio e trancar as portas da fortaleza, o Senhor dos Vampiros convocou seus sete generais mais cruéis.",
      "Titãs de pedra, lâminas de sangue e abominações alquímicas selaram cada um dos portões com feitiçaria profana. Apenas o sangue dos mestres quebrará os selos.",
    ],
    bgImage: "/art/dracula.jpg",
    bgFocus: "top",
    accentColor: "border-purple-500 text-purple-400",
    sfxOnEnter: () => {
      sound.playSfx("spell");
    },
  },
  {
    id: 2,
    badge: "O ÚLTIMO DOS CAÇADORES",
    badgeIcon: "sword",
    title: "ALDRIC VALE",
    subtitle: "A última lâmina entre a noite e a condenação humana",
    paragraphs: [
      "Com a Ordem Sagrada massacrada nas fronteiras, resta apenas Aldric Vale. O caçador jurou marchar até as entranhas do castelo.",
      "Empunhando a lâmina ancestral e a centelha do fogo arcano herdada de seus antepassados, ele avança sozinho. Não há recuo. Não há salvação além da lâmina.",
    ],
    bgImage: "/art/hero.jpg",
    bgFocus: "center",
    accentColor: "border-gold text-gold",
    sfxOnEnter: () => {
      sound.playSfx("slashHeavy");
      setTimeout(() => sound.playSfx("thunder"), 180);
    },
  },
  {
    id: 3,
    badge: "FASE 1 · O CEMITÉRIO DOS ESQUECIDOS",
    badgeIcon: "gate",
    title: "OS PORTÕES DO CASTELO",
    subtitle: "A caçada começa agora",
    paragraphs: [
      "A névoa fria engole seus passos enquanto os portões de ferro batem atrás de você. Os mortos inquietos já sentem seu sangue pulsar.",
      "Corte as trevas, destrua os sete mestres e liberte a humanidade do eclipse eterno.",
    ],
    bgImage: "/art/stage-1.jpg",
    bgFocus: "center",
    accentColor: "border-cyan-400 text-cyan-300",
    sfxOnEnter: () => {
      sound.playSfx("gateOpen");
      setTimeout(() => sound.playSfx("thunder"), 350);
    },
  },
];

export function PrologueScreen({
  onFinish,
  muted,
  onToggleMute,
  isFullscreen,
  onToggleFullscreen,
}: PrologueScreenProps) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [isFlashing, setIsFlashing] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const scene = SCENES[currentIdx];

  // Dispara o som temático de entrada da cena e relâmpago sutil
  useEffect(() => {
    scene.sfxOnEnter?.();
    if (currentIdx === 0 || currentIdx === 2 || currentIdx === 3) {
      setIsFlashing(true);
      const timer = setTimeout(() => setIsFlashing(false), 240);
      return () => clearTimeout(timer);
    }
  }, [currentIdx]);

  // Efeito de partículas de cinzas / névoa flutuantes no canvas de fundo
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

    const particles = Array.from({ length: 45 }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      size: Math.random() * 2.5 + 0.5,
      speedY: -(Math.random() * 0.7 + 0.2),
      speedX: (Math.random() - 0.5) * 0.4,
      opacity: Math.random() * 0.6 + 0.2,
      isEmber: Math.random() > 0.45,
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
          ctx.fillStyle = `rgba(220, 60, 40, ${p.opacity * 0.8})`;
          ctx.shadowColor = "rgba(255, 80, 50, 0.9)";
          ctx.shadowBlur = 4;
        } else {
          ctx.fillStyle = `rgba(200, 180, 140, ${p.opacity * 0.5})`;
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

  const goToNext = useCallback(() => {
    if (isTransitioning) return;
    if (currentIdx < SCENES.length - 1) {
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentIdx((prev) => prev + 1);
        setIsTransitioning(false);
      }, 150);
    } else {
      // Chegou ao fim do prólogo: entra direto na Fase 1
      sound.playSfx("gateOpen");
      onFinish();
    }
  }, [currentIdx, isTransitioning, onFinish]);

  const goToPrev = useCallback(() => {
    if (isTransitioning || currentIdx <= 0) return;
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentIdx((prev) => prev - 1);
      setIsTransitioning(false);
    }, 150);
  }, [currentIdx, isTransitioning]);

  // Teclado: Espaço / Enter / Setas para avançar, Esc para pular
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onFinish();
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
  }, [goToNext, goToPrev, onFinish]);

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col justify-between bg-black text-white select-none overflow-hidden"
      onClick={(e) => {
        // Se clicar fora de botões, avança para a próxima cena
        if ((e.target as HTMLElement).closest("button")) return;
        goToNext();
      }}
    >
      {/* Background Image with Slow Cinematic Zoom */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        {SCENES.map((s, idx) => (
          <div
            key={s.id}
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
              idx === currentIdx ? "opacity-100" : "opacity-0 pointer-events-none"
            }`}
          >
            <img
              src={s.bgImage}
              alt=""
              className={`h-full w-full object-cover transform scale-105 transition-transform duration-[8000ms] ease-out ${
                idx === currentIdx ? "scale-110 translate-y-[-1%]" : "scale-100"
              }`}
              style={{ objectPosition: s.bgFocus }}
            />
            {/* Atmospheric Gothic Gradient Vignettes */}
            <div className="absolute inset-0 bg-radial-[circle_at_center,rgba(0,0,0,0.2)_0%,rgba(0,0,0,0.85)_100%]" />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/65 to-black/80" />
            <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-transparent to-black/80" />
          </div>
        ))}
      </div>

      {/* Floating Particles Canvas */}
      <canvas
        ref={canvasRef}
        className="pointer-events-none absolute inset-0 z-10 opacity-70"
      />

      {/* Lightning Flash Overlay */}
      <div
        className={`pointer-events-none absolute inset-0 z-20 bg-white transition-opacity duration-200 ${
          isFlashing ? "opacity-35" : "opacity-0"
        }`}
      />

      {/* Cinematic Top Letterbox & Header */}
      <header className="relative z-30 flex items-center justify-between px-4 sm:px-8 py-5 border-b border-gold/15 bg-gradient-to-b from-black/90 to-transparent backdrop-blur-xs">
        <div className="flex items-center gap-3">
          <div className="h-2 w-2 rounded-full bg-blood animate-pulse shadow-[0_0_8px_rgba(220,38,38,0.8)]" />
          <span className="font-display text-xs sm:text-sm tracking-widest text-gold uppercase drop-shadow-md">
            Nightfall Chronicles · Prólogo
          </span>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {/* Fullscreen Button */}
          <button
            type="button"
            className="inline-flex h-9 w-9 items-center justify-center border border-line bg-black/70 backdrop-blur-sm font-display text-xs text-fg hover:border-gold rounded transition-all cursor-pointer"
            onClick={onToggleFullscreen}
            title={isFullscreen ? "Sair da Tela Cheia" : "Tela Cheia"}
          >
            {isFullscreen ? (
              <Minimize2 className="h-4 w-4 text-gold" />
            ) : (
              <Maximize2 className="h-4 w-4 text-gold" />
            )}
          </button>

          {/* Audio Button */}
          <button
            type="button"
            className="inline-flex h-9 items-center gap-2 border border-line bg-black/70 backdrop-blur-sm px-3 font-display text-xs tracking-widest text-fg hover:border-gold rounded transition-all cursor-pointer"
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
            className="inline-flex h-9 items-center gap-1.5 border border-gold/50 bg-black/80 hover:bg-blood/80 backdrop-blur-sm px-3.5 font-display text-xs tracking-widest text-gold hover:text-white rounded shadow-md transition-all cursor-pointer"
            onClick={onFinish}
          >
            <span>Pular</span>
            <span className="text-[10px] text-muted hidden sm:inline">[ESC]</span>
          </button>
        </div>
      </header>

      {/* Main Narrative Content Area */}
      <main className="relative z-30 mx-auto flex w-full max-w-4xl flex-1 flex-col justify-center px-6 sm:px-12 py-8">
        <div
          className={`transition-all duration-300 ease-out ${
            isTransitioning ? "opacity-0 translate-y-3" : "opacity-100 translate-y-0"
          }`}
        >
          {/* Act Badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-gold/40 bg-black/80 px-4 py-1.5 backdrop-blur-md shadow-lg">
            {scene.badgeIcon === "moon" && <Sparkles className="h-3.5 w-3.5 text-gold" />}
            {scene.badgeIcon === "skull" && <Skull className="h-3.5 w-3.5 text-purple-400" />}
            {scene.badgeIcon === "sword" && <Sword className="h-3.5 w-3.5 text-gold" />}
            {scene.badgeIcon === "gate" && <ShieldAlert className="h-3.5 w-3.5 text-cyan-400" />}
            <span className="font-display text-[11px] sm:text-xs font-semibold tracking-widest text-gold/90">
              {scene.badge}
            </span>
          </div>

          {/* Act Title */}
          <h1 className="brand-title mt-4 font-display text-3xl sm:text-5xl md:text-6xl text-fg drop-shadow-[0_4px_16px_rgba(0,0,0,1)]">
            {scene.title}
          </h1>

          {/* Subtitle */}
          <p className="mt-2 text-sm sm:text-base font-display tracking-wider text-gold/80 italic drop-shadow-md">
            {scene.subtitle}
          </p>

          {/* Narrative Paragraphs */}
          <div className="mt-6 space-y-4 max-w-2xl">
            {scene.paragraphs.map((p, pIdx) => (
              <p
                key={pIdx}
                className="text-base sm:text-lg md:text-xl font-body leading-relaxed text-slate-200 drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)] bg-black/30 p-2 rounded backdrop-blur-xs"
              >
                {p}
              </p>
            ))}
          </div>

          {/* Act 4 Primary Call-to-Action */}
          {currentIdx === SCENES.length - 1 ? (
            <div className="mt-8 flex items-center gap-4">
              <button
                type="button"
                className="h-14 px-8 bg-gradient-to-r from-blood via-red-800 to-blood hover:from-red-700 hover:to-red-800 border-2 border-gold font-display text-base tracking-widest text-white rounded shadow-[0_0_25px_rgba(200,30,30,0.8)] hover:scale-105 active:scale-95 transition-all flex items-center gap-3 cursor-pointer group"
                onClick={goToNext}
              >
                <Sword className="h-5 w-5 text-gold group-hover:rotate-12 transition-transform" />
                <span>ENTRAR NO CASTELO</span>
                <ChevronRight className="h-5 w-5 text-gold animate-bounce" />
              </button>
            </div>
          ) : null}
        </div>
      </main>

      {/* Cinematic Bottom Bar & Navigation */}
      <footer className="relative z-30 flex items-center justify-between px-4 sm:px-8 py-5 border-t border-gold/15 bg-gradient-to-t from-black/95 to-transparent backdrop-blur-xs">
        {/* Step Indicators */}
        <div className="flex items-center gap-2">
          {SCENES.map((s, idx) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setCurrentIdx(idx)}
              className={`h-2.5 transition-all rounded-full cursor-pointer ${
                idx === currentIdx
                  ? "w-8 bg-gold shadow-[0_0_10px_rgba(255,215,0,0.8)]"
                  : idx < currentIdx
                  ? "w-2.5 bg-blood"
                  : "w-2.5 bg-white/20 hover:bg-white/40"
              }`}
              title={`Ato ${idx + 1}`}
            />
          ))}
          <span className="ml-3 font-display text-xs text-muted tracking-widest hidden sm:inline">
            Ato {currentIdx + 1} de {SCENES.length}
          </span>
        </div>

        {/* Navigation Buttons */}
        <div className="flex items-center gap-2 sm:gap-3">
          {currentIdx > 0 && (
            <button
              type="button"
              className="inline-flex h-11 items-center gap-1.5 border border-line bg-black/70 hover:border-gold px-4 font-display text-xs tracking-widest text-fg rounded transition-all cursor-pointer"
              onClick={goToPrev}
            >
              <ChevronLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Anterior</span>
            </button>
          )}

          <button
            type="button"
            className="inline-flex h-11 items-center gap-2 border border-gold/70 bg-blood px-5 font-display text-xs tracking-widest text-fg hover:brightness-110 active:scale-95 rounded shadow-[0_0_15px_rgba(180,35,48,0.4)] transition-all cursor-pointer"
            onClick={goToNext}
          >
            <span>
              {currentIdx === SCENES.length - 1 ? "Iniciar Batalha" : "Próximo"}
            </span>
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </footer>
    </div>
  );
}
