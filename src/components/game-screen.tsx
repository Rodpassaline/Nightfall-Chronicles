import { useEffect, useRef, useState } from "react";
import {
  Maximize2,
  Minimize2,
  Volume2,
  VolumeX,
  Gamepad2,
  Sword,
  ChevronsUp,
  Wind,
  Sparkles,
  Shield,
  Flame,
} from "lucide-react";
import { loadProgress, mountCampaign, preloadAllGameAssets, saveClear, type CampaignApi, type GameHud } from "@/game/campaign";
import { levels } from "@/game/levels";
import { sound } from "@/game/audio";
import { PrologueScreen } from "./prologue-screen";
import { StageIntroCard } from "./stage-intro-card";

const empty: GameHud = {
  hp: 6,
  maxHp: 6,
  mana: 100,
  maxMana: 100,
  special: 0,
  specialReady: false,
  lives: 3,
  bossName: "",
  bossHp: 0,
  bossMax: 1,
  bossOn: false,
  toast: "",
  won: false,
  dead: false,
  title: "",
  dashReady: true,
  charge: 0,
};

type Mode = "title" | "intro" | "stages" | "play" | "ending";

export function GameScreen() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const apiRef = useRef<CampaignApi | null>(null);
  const isStartingRef = useRef(false);
  const [mode, setMode] = useState<Mode>("title");
  const [levelId, setLevelId] = useState(1);
  const [hud, setHud] = useState<GameHud>(empty);
  const [progress, setProgress] = useState({ unlocked: 1, cleared: [] as number[] });
  const [muted, setMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [hasSeenIntro, setHasSeenIntro] = useState(() => {
    if (typeof window === "undefined") return false;
    try {
      return localStorage.getItem("nightfall_intro_seen") === "true";
    } catch {
      return false;
    }
  });
  const [stageIntroId, setStageIntroId] = useState<number | null>(null);

  useEffect(() => {
    preloadAllGameAssets();
    sound.setMuted(false);
    setMuted(false);
  }, []);

  const [isMobileDevice, setIsMobileDevice] = useState(() => {
    if (typeof window === "undefined") return false;
    const cap = (window as unknown as { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor;
    return (
      Boolean(cap?.isNativePlatform?.()) ||
      "ontouchstart" in window ||
      navigator.maxTouchPoints > 0 ||
      window.innerWidth <= 1024 ||
      window.matchMedia?.("(pointer: coarse)")?.matches === true
    );
  });

  const ensureMobileFullscreen = () => {
    if (typeof window === "undefined") return;
    const cap = (window as unknown as { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor;
    // In Capacitor native Android, fullscreen is already enforced natively by MainActivity
    if (cap?.isNativePlatform?.()) return;
    if (
      ("ontouchstart" in window || navigator.maxTouchPoints > 0 || window.innerWidth <= 1024) &&
      !document.fullscreenElement &&
      document.documentElement.requestFullscreen
    ) {
      document.documentElement.requestFullscreen().catch(() => {});
    }
  };

  useEffect(() => {
    const onFsChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    const onResize = () => {
      const cap = (window as unknown as { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor;
      const mobile =
        Boolean(cap?.isNativePlatform?.()) ||
        "ontouchstart" in window ||
        navigator.maxTouchPoints > 0 ||
        window.innerWidth <= 1024;
      setIsMobileDevice(mobile);
    };
    document.addEventListener("fullscreenchange", onFsChange);
    window.addEventListener("resize", onResize);
    return () => {
      document.removeEventListener("fullscreenchange", onFsChange);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  // Touchscreen Controls State (Default on for mobile/tablets or screens <= 1024px)
  const [showTouchControls, setShowTouchControls] = useState(() => {
    if (typeof window === "undefined") return true;
    const cap = (window as unknown as { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor;
    return (
      Boolean(cap?.isNativePlatform?.()) ||
      "ontouchstart" in window ||
      navigator.maxTouchPoints > 0 ||
      window.innerWidth <= 1024
    );
  });

  // Floating Virtual Joystick state (Left Half)
  const [joystick, setJoystick] = useState<{
    active: boolean;
    pointerId: number | null;
    originX: number;
    originY: number;
    currentX: number;
    currentY: number;
    dx: number;
    dy: number;
    clampedDx: number;
    clampedDy: number;
  }>({
    active: false,
    pointerId: null,
    originX: 0,
    originY: 0,
    currentX: 0,
    currentY: 0,
    dx: 0,
    dy: 0,
    clampedDx: 0,
    clampedDy: 0,
  });

  const joystickRef = useRef(joystick);
  joystickRef.current = joystick;

  // Track active pressed state of action buttons for visual feedback
  const [heldActions, setHeldActions] = useState<Set<string>>(new Set());

  // Left Half Dynamic Joystick Handlers (Anywhere on the left 50% of the screen)
  const handleLeftPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (joystickRef.current.active) return;
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // ignore
    }
    const originX = e.clientX;
    const originY = e.clientY;
    const nextState = {
      active: true,
      pointerId: e.pointerId,
      originX,
      originY,
      currentX: originX,
      currentY: originY,
      dx: 0,
      dy: 0,
      clampedDx: 0,
      clampedDy: 0,
    };
    setJoystick(nextState);
  };

  const handleLeftPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const cur = joystickRef.current;
    if (!cur.active || cur.pointerId !== e.pointerId || !apiRef.current) return;

    let dx = e.clientX - cur.originX;
    let dy = e.clientY - cur.originY;
    const dist = Math.hypot(dx, dy);

    let originX = cur.originX;
    let originY = cur.originY;

    // Smoothly drag joystick origin along if pulled past 52px (floating joystick feel)
    if (dist > 52) {
      const angle = Math.atan2(dy, dx);
      originX = e.clientX - Math.cos(angle) * 52;
      originY = e.clientY - Math.sin(angle) * 52;
      dx = e.clientX - originX;
      dy = e.clientY - originY;
    }

    const currentDist = Math.hypot(dx, dy);
    const clampedDx = currentDist > 38 ? (dx / currentDist) * 38 : dx;
    const clampedDy = currentDist > 38 ? (dy / currentDist) * 38 : dy;

    setJoystick({
      active: true,
      pointerId: cur.pointerId,
      originX,
      originY,
      currentX: e.clientX,
      currentY: e.clientY,
      dx,
      dy,
      clampedDx,
      clampedDy,
    });

    // Horizontal movement (Deadzone: 12px)
    const deadX = 12;
    if (dx < -deadX) {
      apiRef.current.setHeld("left", true);
      apiRef.current.setHeld("right", false);
    } else if (dx > deadX) {
      apiRef.current.setHeld("right", true);
      apiRef.current.setHeld("left", false);
    } else {
      apiRef.current.setHeld("left", false);
      apiRef.current.setHeld("right", false);
    }

    // Vertical movement (aimDown to crouch/drop, aimUp to look up — never override the right-hand PULO button!)
    const deadY = 16;
    if (dy > deadY) {
      apiRef.current.setHeld("aimDown", true);
      apiRef.current.setHeld("aimUp", false);
    } else if (dy < -deadY) {
      apiRef.current.setHeld("aimUp", true);
      apiRef.current.setHeld("aimDown", false);
    } else {
      apiRef.current.setHeld("aimDown", false);
      apiRef.current.setHeld("aimUp", false);
    }
  };

  const handleLeftPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    const cur = joystickRef.current;
    if (!cur.active || cur.pointerId !== e.pointerId) return;

    setJoystick({
      active: false,
      pointerId: null,
      originX: 0,
      originY: 0,
      currentX: 0,
      currentY: 0,
      dx: 0,
      dy: 0,
      clampedDx: 0,
      clampedDy: 0,
    });

    if (apiRef.current) {
      apiRef.current.setHeld("left", false);
      apiRef.current.setHeld("right", false);
      apiRef.current.setHeld("aimDown", false);
      apiRef.current.setHeld("aimUp", false);
    }
  };

  // Right Side Action Button Handlers (Attack, Jump, Dash, Spell, Guard, Special)
  // Supports both direct Touch events (zero-latency multi-touch on smartphones) and Pointer events without pointer-capture contention
  const handleActionDown = (
    e: React.PointerEvent<HTMLButtonElement> | React.TouchEvent<HTMLButtonElement>,
    action: "attack" | "jump" | "dash" | "spell" | "guard" | "special",
  ) => {
    e.preventDefault();
    e.stopPropagation();
    setHeldActions((prev) => {
      if (prev.has(action)) return prev;
      const next = new Set(prev);
      next.add(action);
      return next;
    });
    apiRef.current?.setHeld(action, true);
  };

  const handleActionUp = (
    e: React.PointerEvent<HTMLButtonElement> | React.TouchEvent<HTMLButtonElement>,
    action: "attack" | "jump" | "dash" | "spell" | "guard" | "special",
  ) => {
    e.preventDefault();
    e.stopPropagation();
    setHeldActions((prev) => {
      if (!prev.has(action)) return prev;
      const next = new Set(prev);
      next.delete(action);
      return next;
    });
    apiRef.current?.setHeld(action, false);
  };

  useEffect(() => {
    setProgress(loadProgress());
  }, []);

  useEffect(() => {
    const handleGesture = () => {
      ensureMobileFullscreen();
      sound.resumePlayback();
      if (!sound.isMuted() && (mode === "title" || mode === "stages")) {
        sound.playBgm("title");
      }
    };
    window.addEventListener("pointerdown", handleGesture, { passive: true });
    window.addEventListener("keydown", handleGesture, { passive: true });
    window.addEventListener("click", handleGesture, { passive: true });
    window.addEventListener("touchstart", handleGesture, { passive: true });
    return () => {
      window.removeEventListener("pointerdown", handleGesture);
      window.removeEventListener("keydown", handleGesture);
      window.removeEventListener("click", handleGesture);
      window.removeEventListener("touchstart", handleGesture);
    };
  }, [mode]);

  const toggleAudio = () => {
    const next = sound.toggleMute();
    setMuted(next);
    if (videoRef.current) {
      videoRef.current.muted = next;
    }
    if (!next) {
      if (mode === "title" || mode === "stages") {
        sound.playBgm("title");
      } else if (mode === "play") {
        sound.playStageBgm(levelId);
      }
    }
  };

  const startIntro = () => {
    ensureMobileFullscreen();
    sound.init();
    sound.playBgm("title");
    setMode("intro");
  };

  const handleStartGame = () => {
    if (isStartingRef.current) return;
    isStartingRef.current = true;
    setTimeout(() => {
      isStartingRef.current = false;
    }, 500);

    ensureMobileFullscreen();
    sound.init();
    // Se o jogador clica em iniciar pela primeira vez (ou se não assistiu ao prólogo), exibe a narrativa épica
    if (!hasSeenIntro && progress.cleared.length === 0) {
      startIntro();
    } else {
      play(continueId);
    }
  };

  const finishIntro = () => {
    try {
      localStorage.setItem("nightfall_intro_seen", "true");
    } catch {
      // ignore
    }
    setHasSeenIntro(true);
    // Vai direto para a primeira fase após o prólogo
    play(1);
  };

  // Automatically trigger title music on title and stage selection screens
  useEffect(() => {
    if (mode === "title" || mode === "stages") {
      sound.playBgm("title");
    }
  }, [mode]);

  useEffect(() => {
    if (mode !== "play") return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const api = mountCampaign(canvas, levelId, setHud);
    if (stageIntroId !== null) {
      api.setPaused(true);
    }
    apiRef.current = api;
    const arena = canvas.closest("[data-arena]");
    arena?.scrollIntoView({ block: "start" });
    canvas.focus();
    return () => {
      api.destroy();
      apiRef.current = null;
    };
  }, [mode, levelId]);

  useEffect(() => {
    if (apiRef.current) {
      apiRef.current.setPaused(stageIntroId !== null);
    }
  }, [stageIntroId]);

  useEffect(() => {
    if (mode !== "play" || !hud.won) return;
    setProgress(saveClear(levelId));
  }, [mode, hud.won, levelId]);

  const level = levels.find((item) => item.id === levelId) ?? levels[0];
  const continueId = levels.find((item) => item.id <= progress.unlocked && !progress.cleared.includes(item.id))?.id ?? progress.unlocked;

  const play = (id: number) => {
    ensureMobileFullscreen();
    sound.setMuted(false);
    setMuted(false);
    sound.init();
    sound.playStageBgm(id);
    setLevelId(id);
    setHud(empty);
    setMode("play");
    setStageIntroId(id);
  };

  if (mode === "intro") {
    return (
      <PrologueScreen
        onFinish={finishIntro}
        muted={muted}
        onToggleMute={toggleAudio}
        isFullscreen={isFullscreen}
        onToggleFullscreen={toggleFullscreen}
        hideFullscreenButton={isMobileDevice}
      />
    );
  }

  if (mode === "title") {
    return (
      <div
        className="relative min-h-screen"
        onPointerDown={() => {
          sound.init();
          sound.playBgm("title");
        }}
      >
        <img src="/art/stage-7.jpg" alt="" className="pointer-events-none absolute inset-0 h-full w-full object-cover" />
        <div className="pointer-events-none absolute inset-0 bg-bg/80" />
        <div className="relative z-10 mx-auto flex min-h-screen max-w-3xl flex-col justify-center px-4 py-16 pb-28">
          <p className="font-display text-xs tracking-widest text-gold">Campanha · 7 fases</p>
          <h1 className="brand-title mt-2 font-display text-5xl sm:text-6xl">Nightfall Chronicles</h1>
          <p className="mt-4 max-w-xl text-lg text-fg">
            Aldric Vale atravessa os salões a pé. A lâmina, a esquiva e a magia abrem o caminho até Drácula. Não há abismos para pular.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-2">
            <button
              type="button"
              className="h-12 bg-blood px-6 font-display text-sm tracking-widest text-fg hover:brightness-110 active:scale-95 transition-all cursor-pointer"
              onPointerDown={handleStartGame}
              onClick={handleStartGame}
            >
              {progress.cleared.length > 0 ? "Continuar" : "Iniciar"}
            </button>
            <button
              type="button"
              className="h-11 border border-line px-5 font-display text-sm tracking-widest text-fg hover:border-gold hover:text-gold transition-all cursor-pointer"
              onClick={startIntro}
            >
              Prólogo
            </button>
            <button
              type="button"
              className="h-11 border border-line px-5 font-display text-sm tracking-widest text-fg hover:border-gold hover:text-gold transition-all cursor-pointer"
              onClick={() => {
                sound.init();
                sound.playBgm("title");
                setMode("stages");
              }}
            >
              Fases
            </button>
            <button
              type="button"
              className="inline-flex h-11 items-center gap-2 border border-line bg-surface/80 px-4 font-display text-xs tracking-widest text-fg hover:border-gold transition-all cursor-pointer"
              onClick={toggleAudio}
            >
              {muted ? <VolumeX className="h-4 w-4 text-blood" /> : <Volume2 className="h-4 w-4 text-gold" />}
              <span>{muted ? "Mudo" : "Música & SFX"}</span>
            </button>
          </div>
          <p className="mt-6 max-w-xl text-sm text-muted">A e D andam. J (ou Z) ataca — segure para carregar. K esquiva. L (ou F) magia. E (ou Ataque+Magia) golpe especial quando a barra encher ao matar inimigos. W pula.</p>
        </div>
      </div>
    );
  }

  if (mode === "stages") {
    return (
      <main className="mx-auto max-w-5xl px-4 py-8">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="font-display text-xs tracking-widest text-gold">Mapa do castelo</p>
            <h1 className="font-display text-3xl text-fg">Sete portões</h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="inline-flex h-11 items-center gap-1.5 border border-line px-3 font-display text-xs tracking-widest text-fg hover:border-gold"
              onClick={toggleAudio}
            >
              {muted ? <VolumeX className="h-4 w-4 text-blood" /> : <Volume2 className="h-4 w-4 text-gold" />}
              <span>{muted ? "Mudo" : "Som"}</span>
            </button>
            <button type="button" className="h-11 border border-line px-4 font-display text-xs tracking-widest text-fg" onClick={() => setMode("title")}>
              Título
            </button>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {levels.map((item) => {
            const locked = item.id > progress.unlocked;
            const cleared = progress.cleared.includes(item.id);
            return (
              <button
                key={item.id}
                type="button"
                disabled={locked}
                onPointerDown={() => {
                  if (!locked) play(item.id);
                }}
                onClick={() => play(item.id)}
                className={locked ? "border border-line bg-surface text-left opacity-50" : "border border-line bg-surface text-left"}
              >
                <img src={item.bg} alt="" className="h-28 w-full object-cover" />
                <div className="px-3 py-3">
                  <p className="font-display text-xs tracking-widest text-gold">Fase {item.id}</p>
                  <p className="font-display text-lg text-fg">{item.title}</p>
                  <p className="text-sm text-muted">{locked ? "Selada até a fase anterior" : cleared ? "Conquistada" : item.place}</p>
                </div>
              </button>
            );
          })}
        </div>
      </main>
    );
  }

  if (mode === "ending") {
    return (
      <main className="mx-auto grid max-w-5xl gap-6 px-4 py-10 md:grid-cols-2">
        <img src="/art/dracula.jpg" alt="Drácula no trono, derrotado na última fase." className="w-full border border-line object-cover" />
        <div className="flex flex-col justify-center">
          <p className="font-display text-xs tracking-widest text-gold">Epílogo</p>
          <h1 className="brand-title mt-2 font-display text-4xl">A noite recua</h1>
          <p className="mt-4 text-lg text-fg">O Último Mestre cai. Aldric deixa a sala do trono com a lâmina ainda quente.</p>
          <div className="mt-8 flex flex-col gap-2 sm:flex-row">
            <button type="button" className="h-11 bg-blood px-5 font-display text-sm tracking-widest text-fg" onClick={() => setMode("title")}>
              Título
            </button>
            <button type="button" className="h-11 border border-line px-5 font-display text-sm tracking-widest text-fg" onClick={() => play(7)}>
              Refazer o trono
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <div
      data-arena
      className="fixed inset-0 z-50 w-screen h-screen bg-black flex items-center justify-center overflow-hidden select-none"
    >
      {/* Pure Fullscreen Responsive Canvas */}
      <canvas
        ref={canvasRef}
        width={480}
        height={270}
        tabIndex={0}
        aria-label={`Fase ${level.title}`}
        className="pixel-canvas-fullscreen focus:outline-none touch-none"
        onMouseDown={() => {
          if (!showTouchControls && !isMobileDevice) {
            apiRef.current?.setHeld("attack", true);
          }
        }}
        onMouseUp={() => {
          if (!showTouchControls && !isMobileDevice) {
            apiRef.current?.setHeld("attack", false);
          }
        }}
      />

      {/* Left Half Touchscreen Movement Zone (Active across the entire left 50% of the screen) */}
      {showTouchControls ? (
        <div
          data-touch-left
          className="absolute inset-y-0 left-0 w-1/2 z-20 touch-none select-none cursor-crosshair"
          onPointerDown={handleLeftPointerDown}
          onPointerMove={handleLeftPointerMove}
          onPointerUp={handleLeftPointerUp}
          onPointerCancel={handleLeftPointerUp}
        />
      ) : null}

      {/* Free Fire Style Virtual Joystick on Left Half (Always visible when touch controls enabled) */}
      {showTouchControls ? (
        <div
          className={`absolute pointer-events-none z-30 select-none transition-opacity duration-75 ${
            joystick.active
              ? "-translate-x-1/2 -translate-y-1/2 opacity-95"
              : "bottom-7 left-8 sm:bottom-9 sm:left-12 opacity-75"
          }`}
          style={
            joystick.active
              ? {
                  left: `${joystick.originX}px`,
                  top: `${joystick.originY}px`,
                }
              : undefined
          }
        >
          {/* Free Fire Style Translucent Outer Base Ring */}
          <div className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-full border-2 border-white/30 bg-black/25 backdrop-blur-[1px] shadow-[inset_0_0_18px_rgba(0,0,0,0.5)] flex items-center justify-center">
            {/* Subtle Inner Guide Circle */}
            <div className="w-16 h-16 rounded-full border border-white/15 pointer-events-none" />

            {/* Directional Rim Chevrons */}
            <span
              className={`absolute top-1.5 text-[10px] font-bold transition-transform ${
                joystick.active && joystick.dy < -16 ? "text-white scale-125" : "text-white/35"
              }`}
            >
              ▲
            </span>
            <span
              className={`absolute bottom-1.5 text-[10px] font-bold transition-transform ${
                joystick.active && joystick.dy > 16 ? "text-white scale-125" : "text-white/35"
              }`}
            >
              ▼
            </span>
            <span
              className={`absolute left-1.5 text-[10px] font-bold transition-transform ${
                joystick.active && joystick.dx < -12 ? "text-white scale-125" : "text-white/35"
              }`}
            >
              ◀
            </span>
            <span
              className={`absolute right-1.5 text-[10px] font-bold transition-transform ${
                joystick.active && joystick.dx > 12 ? "text-white scale-125" : "text-white/35"
              }`}
            >
              ▶
            </span>

            {/* Free Fire Metallic White/Silver Thumb Knob */}
            <div
              className="absolute w-11 h-11 sm:w-12 sm:h-12 rounded-full border-2 border-white bg-gradient-to-b from-white/95 via-zinc-200/90 to-zinc-400/85 shadow-[0_3px_12px_rgba(0,0,0,0.75)] flex items-center justify-center"
              style={{
                transform: `translate(${joystick.active ? joystick.clampedDx : 0}px, ${
                  joystick.active ? joystick.clampedDy : 0
                }px)`,
              }}
            >
              <div className="w-6 h-6 rounded-full border border-zinc-400/50 bg-white/60" />
            </div>
          </div>
        </div>
      ) : null}

      {/* Right Half Touchscreen Action Buttons — Free Fire Ergonomic Radial Arc Layout */}
      {showTouchControls ? (
        <div className="absolute inset-0 z-30 pointer-events-none select-none overflow-hidden">
          {/* 1. PRIMARY ATTACK BUTTON (Large Fire/Sword Circle inset from bottom-right, Free Fire Main Fire position) */}
          <button
            type="button"
            className={`pointer-events-auto touch-none after:content-[''] after:absolute after:-inset-2.5 after:rounded-full absolute bottom-[54px] right-[92px] sm:bottom-[64px] sm:right-[108px] h-[78px] w-[78px] sm:h-[86px] sm:w-[86px] rounded-full border-2 flex flex-col items-center justify-center transition-all duration-75 active:scale-90 shadow-2xl ${
              heldActions.has("attack")
                ? "border-red-400 bg-red-600/80 scale-90 shadow-[0_0_26px_rgba(239,68,68,0.95)] text-white"
                : "border-white/45 bg-black/45 backdrop-blur-[2px] text-white hover:border-white/70 shadow-[0_4px_18px_rgba(0,0,0,0.65)]"
            }`}
            onTouchStart={(e) => handleActionDown(e, "attack")}
            onTouchEnd={(e) => handleActionUp(e, "attack")}
            onTouchCancel={(e) => handleActionUp(e, "attack")}
            onPointerDown={(e) => handleActionDown(e, "attack")}
            onPointerUp={(e) => handleActionUp(e, "attack")}
            onPointerCancel={(e) => handleActionUp(e, "attack")}
          >
            <div className="pointer-events-none absolute inset-1.5 rounded-full border border-white/20" />
            <Sword className="pointer-events-none h-8 w-8 sm:h-9 sm:w-9 -rotate-45 text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]" />
            <span className="pointer-events-none text-[8.5px] font-display font-bold tracking-wider leading-none mt-0.5 text-white/90">
              ATAQUE
            </span>
          </button>

          {/* 2. TOP-RIGHT ARC BUTTON: MAGIA (Free Fire Scope/Aim position at top of right edge) */}
          <button
            type="button"
            className={`pointer-events-auto touch-none after:content-[''] after:absolute after:-inset-2 after:rounded-full absolute bottom-[180px] right-3.5 sm:bottom-[198px] sm:right-5 h-[52px] w-[52px] sm:h-14 sm:w-14 rounded-full border-2 flex flex-col items-center justify-center transition-all duration-75 active:scale-90 shadow-xl ${
              heldActions.has("spell")
                ? "border-purple-300 bg-purple-700/80 scale-90 shadow-[0_0_18px_rgba(168,85,247,0.95)] text-white"
                : "border-white/35 bg-black/45 backdrop-blur-[2px] text-white/95 hover:border-white/60"
            }`}
            onTouchStart={(e) => handleActionDown(e, "spell")}
            onTouchEnd={(e) => handleActionUp(e, "spell")}
            onTouchCancel={(e) => handleActionUp(e, "spell")}
            onPointerDown={(e) => handleActionDown(e, "spell")}
            onPointerUp={(e) => handleActionUp(e, "spell")}
            onPointerCancel={(e) => handleActionUp(e, "spell")}
          >
            <div className="pointer-events-none absolute inset-1 rounded-full border border-white/15" />
            <Sparkles className="pointer-events-none h-5 w-5 text-purple-200 drop-shadow" />
            <span className="pointer-events-none text-[7.5px] font-display font-bold tracking-tight leading-none mt-0.5 text-white/90">
              MAGIA
            </span>
          </button>

          {/* 3. MIDDLE-RIGHT ARC BUTTON: PULO (Free Fire Jump position at middle of right edge) */}
          <button
            type="button"
            className={`pointer-events-auto touch-none after:content-[''] after:absolute after:-inset-2 after:rounded-full absolute bottom-[96px] right-3.5 sm:bottom-[106px] sm:right-5 h-[52px] w-[52px] sm:h-14 sm:w-14 rounded-full border-2 flex flex-col items-center justify-center transition-all duration-75 active:scale-90 shadow-xl ${
              heldActions.has("jump")
                ? "border-amber-300 bg-amber-600/80 scale-90 shadow-[0_0_18px_rgba(245,158,11,0.95)] text-white"
                : "border-white/35 bg-black/45 backdrop-blur-[2px] text-white/95 hover:border-white/60"
            }`}
            onTouchStart={(e) => handleActionDown(e, "jump")}
            onTouchEnd={(e) => handleActionUp(e, "jump")}
            onTouchCancel={(e) => handleActionUp(e, "jump")}
            onPointerDown={(e) => handleActionDown(e, "jump")}
            onPointerUp={(e) => handleActionUp(e, "jump")}
            onPointerCancel={(e) => handleActionUp(e, "jump")}
          >
            <div className="pointer-events-none absolute inset-1 rounded-full border border-white/15" />
            <ChevronsUp className="pointer-events-none h-6 w-6 text-white drop-shadow" />
            <span className="pointer-events-none text-[7.5px] font-display font-bold tracking-tight leading-none mt-0.5 text-white/90">
              PULO
            </span>
          </button>

          {/* 4. BOTTOM-RIGHT CORNER BUTTON: DASH (Free Fire Crouch position at bottom-right corner) */}
          <button
            type="button"
            className={`pointer-events-auto touch-none after:content-[''] after:absolute after:-inset-2 after:rounded-full absolute bottom-3.5 right-3.5 sm:bottom-4 sm:right-5 h-[52px] w-[52px] sm:h-14 sm:w-14 rounded-full border-2 flex flex-col items-center justify-center transition-all duration-75 active:scale-90 shadow-xl ${
              heldActions.has("dash")
                ? "border-cyan-300 bg-cyan-700/80 scale-90 shadow-[0_0_18px_rgba(34,211,238,0.95)] text-white"
                : "border-white/35 bg-black/45 backdrop-blur-[2px] text-white/95 hover:border-white/60"
            }`}
            onTouchStart={(e) => handleActionDown(e, "dash")}
            onTouchEnd={(e) => handleActionUp(e, "dash")}
            onTouchCancel={(e) => handleActionUp(e, "dash")}
            onPointerDown={(e) => handleActionDown(e, "dash")}
            onPointerUp={(e) => handleActionUp(e, "dash")}
            onPointerCancel={(e) => handleActionUp(e, "dash")}
          >
            <div className="pointer-events-none absolute inset-1 rounded-full border border-white/15" />
            <Wind className="pointer-events-none h-5 w-5 text-cyan-200 drop-shadow" />
            <span className="pointer-events-none text-[7.5px] font-display font-bold tracking-tight leading-none mt-0.5 text-white/90">
              DASH
            </span>
          </button>

          {/* 5. BOTTOM-LEFT OF ATTACK CLUSTER: ESCUDO (Free Fire Prone position to bottom-left of Fire button) */}
          <button
            type="button"
            className={`pointer-events-auto touch-none after:content-[''] after:absolute after:-inset-2 after:rounded-full absolute bottom-3.5 right-[182px] sm:bottom-4 sm:right-[208px] h-[50px] w-[50px] sm:h-[54px] sm:w-[54px] rounded-full border-2 flex flex-col items-center justify-center transition-all duration-75 active:scale-90 shadow-xl ${
              heldActions.has("guard")
                ? "border-gold bg-amber-800/85 scale-90 shadow-[0_0_16px_rgba(200,160,80,0.9)] text-white"
                : "border-white/35 bg-black/45 backdrop-blur-[2px] text-white/90 hover:border-white/60"
            }`}
            onTouchStart={(e) => handleActionDown(e, "guard")}
            onTouchEnd={(e) => handleActionUp(e, "guard")}
            onTouchCancel={(e) => handleActionUp(e, "guard")}
            onPointerDown={(e) => handleActionDown(e, "guard")}
            onPointerUp={(e) => handleActionUp(e, "guard")}
            onPointerCancel={(e) => handleActionUp(e, "guard")}
          >
            <div className="pointer-events-none absolute inset-1 rounded-full border border-white/15" />
            <Shield className="pointer-events-none h-4 w-4 sm:h-5 sm:w-5 text-amber-200 drop-shadow" />
            <span className="pointer-events-none text-[7px] font-display font-bold tracking-tight leading-none mt-0.5 text-white/90">
              ESCUDO
            </span>
          </button>

          {/* 6. UPPER-LEFT OF ATTACK BUTTON: ESPECIAL (Free Fire Gloo Wall / Skill position to upper-left of Fire button) */}
          <button
            type="button"
            className={`pointer-events-auto touch-none after:content-[''] after:absolute after:-inset-2 after:rounded-full absolute bottom-[122px] right-[188px] sm:bottom-[136px] sm:right-[214px] h-[56px] w-[56px] sm:h-[60px] sm:w-[60px] rounded-full border-2 flex flex-col items-center justify-center transition-all duration-75 active:scale-90 shadow-xl ${
              heldActions.has("special")
                ? "border-red-300 bg-red-600 scale-90 shadow-[0_0_24px_rgba(255,23,68,1)] text-white"
                : hud.specialReady
                  ? "border-red-500 bg-red-950/85 backdrop-blur-[2px] text-red-200 animate-pulse shadow-[0_0_18px_rgba(255,23,68,0.85)]"
                  : "border-white/30 bg-black/45 backdrop-blur-[2px] text-white/75 hover:border-white/50"
            }`}
            onTouchStart={(e) => handleActionDown(e, "special")}
            onTouchEnd={(e) => handleActionUp(e, "special")}
            onTouchCancel={(e) => handleActionUp(e, "special")}
            onPointerDown={(e) => handleActionDown(e, "special")}
            onPointerUp={(e) => handleActionUp(e, "special")}
            onPointerCancel={(e) => handleActionUp(e, "special")}
            title="Golpe Especial (Golpe Crescente)"
          >
            <div className="pointer-events-none absolute inset-1 rounded-full border border-white/15" />
            <Flame className={`pointer-events-none h-5 w-5 ${hud.specialReady ? "text-red-400 fill-red-500" : "text-red-400/70"}`} />
            <span className="pointer-events-none text-[7px] font-display font-bold tracking-tighter leading-none mt-0.5">
              {hud.specialReady ? "ESPECIAL!" : `${hud.special}%`}
            </span>
          </button>
        </div>
      ) : null}

      {/* Floating Minimalist Gothic HUD (Top) */}
      <header className="absolute top-2 left-2 right-2 sm:top-3 sm:left-4 sm:right-4 z-30 pointer-events-none flex items-start justify-between gap-2">
        {/* Left: Player Vital Stats */}
        <div className="flex items-center gap-2 sm:gap-3 bg-black/75 backdrop-blur-md border border-gold/40 p-1.5 sm:p-2 rounded shadow-2xl">
          <img
            src="/art/hero.jpg"
            alt="Aldric Vale"
            className="h-8 w-8 sm:h-10 sm:w-10 border border-gold/50 object-cover object-top rounded-xs shadow"
          />
          <div className="flex flex-col min-w-28 sm:min-w-36">
            <div className="flex items-center justify-between gap-1.5">
              <span className="font-display text-[10px] sm:text-xs text-gold tracking-widest font-bold truncate">
                Fase {level.id} · {level.title}
              </span>
              {/* Hearts / Lives */}
              <div className="flex items-center gap-0.5 bg-blood/30 border border-gold/40 px-1.5 py-0.2 rounded">
                <span className="text-[10px] text-blood font-bold leading-none">♥</span>
                <span className="font-display text-[10px] text-gold font-bold leading-none">x{hud.lives}</span>
              </div>
            </div>
            {/* Health Bars */}
            <div className="mt-1 flex gap-0.5 sm:gap-1">
              {Array.from({ length: hud.maxHp }, (_, i) => (
                <span
                  key={i}
                  className={`h-1.5 sm:h-2 flex-1 rounded-xs transition-colors ${
                    i < hud.hp ? "bg-blood shadow-[0_0_4px_rgba(180,35,48,0.8)]" : "bg-surface-2"
                  }`}
                />
              ))}
            </div>
            {/* Mana Bar */}
            <div className="mt-1 h-1 bg-surface-2 rounded-full overflow-hidden">
              <div
                className="h-full bg-gold transition-all duration-150"
                style={{ width: `${(hud.mana / hud.maxMana) * 100}%` }}
              />
            </div>
            {/* Special Meter (Golpe Crescente) */}
            <div className="mt-1 flex flex-col gap-0.5">
              <div className="flex items-center justify-between text-[8px] font-display">
                <span className={`font-bold tracking-wider flex items-center gap-0.5 ${hud.specialReady ? "text-red-400 animate-pulse font-extrabold" : "text-muted"}`}>
                  <Flame className={`h-2.5 w-2.5 ${hud.specialReady ? "text-red-500 fill-red-500 animate-bounce" : "text-muted"}`} />
                  {hud.specialReady ? "ESPECIAL PRONTO!" : "ESPECIAL"}
                </span>
                <span className={`font-bold ${hud.specialReady ? "text-red-400 font-extrabold" : "text-muted"}`}>
                  {hud.special}%
                </span>
              </div>
              <div className={`h-1.5 rounded-full overflow-hidden border ${hud.specialReady ? "border-red-500/80 bg-red-950/60 shadow-[0_0_8px_rgba(255,23,68,0.8)]" : "border-line/40 bg-surface-2"}`}>
                <div
                  className={`h-full transition-all duration-200 ${
                    hud.specialReady
                      ? "bg-gradient-to-r from-red-600 via-rose-500 to-amber-300 animate-pulse shadow-[0_0_10px_rgba(255,23,68,1)]"
                      : "bg-gradient-to-r from-red-900 to-rose-600"
                  }`}
                  style={{ width: `${Math.min(100, hud.special)}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Center: Boss Meter (Active during Boss Fights) */}
        {hud.bossOn ? (
          <div className="flex flex-col items-center bg-black/85 backdrop-blur-md border border-blood/70 px-3 py-1 sm:px-4 sm:py-1.5 rounded shadow-2xl max-w-xs sm:max-w-md w-full mx-2">
            <span className="font-display text-[10px] sm:text-xs tracking-widest text-fg font-bold uppercase truncate">
              {hud.bossName}
            </span>
            <div className="mt-1 h-1.5 sm:h-2 w-full bg-surface-2 rounded-full overflow-hidden border border-blood/40">
              <div
                className="h-full bg-blood shadow-[0_0_8px_rgba(180,35,48,0.9)] transition-all duration-150"
                style={{ width: `${(hud.bossHp / Math.max(1, hud.bossMax)) * 100}%` }}
              />
            </div>
          </div>
        ) : null}

        {/* Right: Quick Controls (Pointer Events Enabled) */}
        <div className="pointer-events-auto flex items-center gap-1 sm:gap-1.5 bg-black/75 backdrop-blur-md border border-gold/40 p-1 sm:p-1.5 rounded shadow-2xl">
          <button
            type="button"
            className={`flex h-8 sm:h-9 px-2 sm:px-2.5 items-center gap-1 border border-line bg-surface/80 font-display text-[11px] sm:text-xs tracking-wider rounded transition ${
              showTouchControls ? "border-gold text-gold" : "text-fg/70 hover:border-gold hover:text-gold"
            }`}
            onClick={() => setShowTouchControls((prev) => !prev)}
            title={showTouchControls ? "Ocultar Controles Touch" : "Exibir Controles Touch"}
          >
            <Gamepad2 className="h-4 w-4" />
            <span className="hidden sm:inline">Touch</span>
          </button>
          <button
            type="button"
            className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center border border-line bg-surface/80 text-fg hover:border-gold hover:text-gold rounded transition"
            onClick={toggleAudio}
            title={muted ? "Ativar áudio" : "Desativar áudio"}
          >
            {muted ? <VolumeX className="h-4 w-4 text-blood" /> : <Volume2 className="h-4 w-4 text-gold" />}
          </button>
          {!isMobileDevice ? (
            <button
              type="button"
              className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center border border-line bg-surface/80 text-fg hover:border-gold hover:text-gold rounded transition"
              onClick={toggleFullscreen}
              title={isFullscreen ? "Sair da Tela Cheia" : "Tela Cheia"}
            >
              {isFullscreen ? <Minimize2 className="h-4 w-4 text-gold" /> : <Maximize2 className="h-4 w-4 text-fg" />}
            </button>
          ) : null}
          <button
            type="button"
            className="h-8 sm:h-9 border border-line bg-surface/80 px-2 sm:px-2.5 font-display text-[11px] sm:text-xs tracking-wider text-fg hover:border-blood hover:text-blood rounded transition"
            onClick={() => {
              sound.stopBgm();
              sound.playBgm("title");
              setMode("stages");
            }}
            title="Sair para o Mapa"
          >
            Sair
          </button>
        </div>
      </header>

      {/* Ephemeral Toast Alert (Bottom Center) */}
      {hud.toast ? (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-30 pointer-events-none bg-black/80 backdrop-blur-md border border-gold/50 px-3 py-1 rounded shadow-lg max-w-sm text-center">
          <p className="font-display text-[11px] text-gold tracking-wider">{hud.toast}</p>
        </div>
      ) : null}

      {/* Game Over / Stage Cleared Overlay Modal */}
      {hud.won || hud.dead ? (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/85 backdrop-blur-sm px-4">
          <div className="w-full max-w-sm border border-gold/60 bg-surface/95 p-6 text-center shadow-2xl rounded">
            <p className="font-display text-xl text-fg font-bold tracking-wide">
              {hud.dead ? "Game Over — Vidas Esgotadas" : level.id === 7 ? "Drácula Caiu" : "O Portão Cedeu"}
            </p>
            <p className="mt-2 text-sm text-muted">
              {hud.dead
                ? "Todas as suas vidas foram ceifadas na escuridão do castelo."
                : hud.toast || "A fase foi conquistada com sucesso."}
            </p>
            <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
              {hud.dead ? (
                <button
                  type="button"
                  className="h-11 bg-blood px-5 font-display text-xs tracking-widest text-fg hover:brightness-110 rounded shadow transition"
                  onClick={() => {
                    apiRef.current?.reset();
                    setStageIntroId(level.id);
                  }}
                >
                  Reiniciar Fase (3 Vidas)
                </button>
              ) : level.id < 7 ? (
                <button
                  type="button"
                  className="h-11 bg-blood px-5 font-display text-xs tracking-widest text-fg hover:brightness-110 rounded shadow transition"
                  onClick={() => play(level.id + 1)}
                >
                  Próxima Fase
                </button>
              ) : (
                <button
                  type="button"
                  className="h-11 bg-blood px-5 font-display text-xs tracking-widest text-fg hover:brightness-110 rounded shadow transition"
                  onClick={() => setMode("ending")}
                >
                  Epílogo
                </button>
              )}
              <button
                type="button"
                className="h-11 border border-line px-5 font-display text-xs tracking-widest text-fg hover:border-gold rounded transition"
                onClick={() => {
                  sound.playBgm("title");
                  setMode("stages");
                }}
              >
                Mapa
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* Crisp High-Resolution Stage Introduction Card */}
      {stageIntroId !== null ? (
        <StageIntroCard
          stageId={stageIntroId}
          onDismiss={() => {
            setStageIntroId(null);
            apiRef.current?.setPaused(false);
          }}
        />
      ) : null}
    </div>
  );
}
