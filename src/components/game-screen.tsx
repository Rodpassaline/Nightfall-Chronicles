import { useEffect, useRef, useState, type PointerEvent } from "react";
import { Maximize2, Minimize2, Volume2, VolumeX } from "lucide-react";
import { loadProgress, mountCampaign, preloadAllGameAssets, saveClear, type CampaignApi, type GameHud } from "@/game/campaign";
import { levels } from "@/game/levels";
import { sound } from "@/game/audio";

const empty: GameHud = {
  hp: 6,
  maxHp: 6,
  mana: 100,
  maxMana: 100,
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

type Mode = "title" | "stages" | "play" | "ending";

export function GameScreen() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const apiRef = useRef<CampaignApi | null>(null);
  const [mode, setMode] = useState<Mode>("title");
  const [levelId, setLevelId] = useState(1);
  const [hud, setHud] = useState<GameHud>(empty);
  const [progress, setProgress] = useState({ unlocked: 1, cleared: [] as number[] });
  const [muted, setMuted] = useState(() => sound.isMuted());
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    preloadAllGameAssets();
  }, []);

  useEffect(() => {
    const onFsChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener("fullscreenchange", onFsChange);
    return () => document.removeEventListener("fullscreenchange", onFsChange);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  // Invisible gesture controls for smartphones & touch devices
  const activeTouches = useRef<
    Map<
      number,
      {
        startX: number;
        startY: number;
        side: "left" | "right";
        startTime: number;
        lastAction?: "left" | "right" | "jump" | "aimDown" | "attack" | "dash" | "spell";
      }
    >
  >(new Map());
  const lastRightTapTime = useRef(0);

  const handlePointerDown = (e: PointerEvent<HTMLCanvasElement>) => {
    if (e.pointerType === "mouse") return;
    const canvas = canvasRef.current;
    if (!canvas || !apiRef.current) return;
    try {
      canvas.setPointerCapture(e.pointerId);
    } catch {
      // ignore
    }

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const isLeft = x < rect.width * 0.45;
    const now = Date.now();

    if (isLeft) {
      activeTouches.current.set(e.pointerId, {
        startX: x,
        startY: y,
        side: "left",
        startTime: now,
      });
    } else {
      if (now - lastRightTapTime.current < 280) {
        apiRef.current.setHeld("spell", true);
        window.setTimeout(() => apiRef.current?.setHeld("spell", false), 200);
        activeTouches.current.set(e.pointerId, {
          startX: x,
          startY: y,
          side: "right",
          startTime: now,
          lastAction: "spell",
        });
      } else {
        apiRef.current.setHeld("attack", true);
        activeTouches.current.set(e.pointerId, {
          startX: x,
          startY: y,
          side: "right",
          startTime: now,
          lastAction: "attack",
        });
      }
      lastRightTapTime.current = now;
    }
  };

  const handlePointerMove = (e: PointerEvent<HTMLCanvasElement>) => {
    const touch = activeTouches.current.get(e.pointerId);
    if (!touch || !canvasRef.current || !apiRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const dx = x - touch.startX;
    const dy = y - touch.startY;

    if (touch.side === "left") {
      if (dx > 20) {
        apiRef.current.setHeld("right", true);
        apiRef.current.setHeld("left", false);
      } else if (dx < -20) {
        apiRef.current.setHeld("left", true);
        apiRef.current.setHeld("right", false);
      } else {
        apiRef.current.setHeld("left", false);
        apiRef.current.setHeld("right", false);
      }

      if (dy > 30) {
        apiRef.current.setHeld("aimDown", true);
      } else {
        apiRef.current.setHeld("aimDown", false);
      }

      if (dy < -35) {
        apiRef.current.setHeld("jump", true);
      } else {
        apiRef.current.setHeld("jump", false);
      }
    } else {
      const duration = Date.now() - touch.startTime;
      if (duration < 350) {
        if (dy < -30 && touch.lastAction !== "jump") {
          apiRef.current.setHeld("attack", false);
          apiRef.current.setHeld("jump", true);
          touch.lastAction = "jump";
          window.setTimeout(() => apiRef.current?.setHeld("jump", false), 200);
        } else if (Math.abs(dx) > 35 && touch.lastAction !== "dash") {
          apiRef.current.setHeld("attack", false);
          apiRef.current.setHeld("dash", true);
          touch.lastAction = "dash";
          window.setTimeout(() => apiRef.current?.setHeld("dash", false), 200);
        }
      }
    }
  };

  const handlePointerUp = (e: PointerEvent<HTMLCanvasElement>) => {
    const touch = activeTouches.current.get(e.pointerId);
    if (!touch || !apiRef.current) return;

    if (touch.side === "left") {
      apiRef.current.setHeld("left", false);
      apiRef.current.setHeld("right", false);
      apiRef.current.setHeld("aimDown", false);
      apiRef.current.setHeld("jump", false);
    } else {
      if (touch.lastAction === "attack") {
        apiRef.current.setHeld("attack", false);
      } else if (touch.lastAction === "spell") {
        apiRef.current.setHeld("spell", false);
      }
    }

    activeTouches.current.delete(e.pointerId);
  };

  useEffect(() => {
    setProgress(loadProgress());
  }, []);

  useEffect(() => {
    if (mode === "title" || mode === "stages") {
      const handleGesture = () => {
        sound.init();
        if (!sound.isMuted() && (mode === "title" || mode === "stages")) {
          sound.playBgm("title");
        }
      };
      window.addEventListener("pointerdown", handleGesture, { once: true });
      window.addEventListener("keydown", handleGesture, { once: true });
      return () => {
        window.removeEventListener("pointerdown", handleGesture);
        window.removeEventListener("keydown", handleGesture);
      };
    } else if (mode === "ending") {
      sound.playBgm("victory");
    }
  }, [mode]);

  const toggleAudio = () => {
    const next = sound.toggleMute();
    setMuted(next);
    if (!next) {
      if (mode === "title" || mode === "stages") {
        sound.playBgm("title");
      } else if (mode === "play") {
        sound.playStageBgm(levelId);
      }
    }
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
    if (mode !== "play" || !hud.won) return;
    setProgress(saveClear(levelId));
  }, [mode, hud.won, levelId]);

  const level = levels.find((item) => item.id === levelId) ?? levels[0];
  const continueId = levels.find((item) => item.id <= progress.unlocked && !progress.cleared.includes(item.id))?.id ?? progress.unlocked;


  const play = (id: number) => {
    sound.init();
    setLevelId(id);
    setHud(empty);
    setMode("play");
  };

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
              className="h-12 bg-blood px-6 font-display text-sm tracking-widest text-fg"
              onPointerDown={() => play(continueId)}
              onClick={() => play(continueId)}
            >
              {progress.cleared.length > 0 ? "Continuar" : "Jogar"}
            </button>
            <button
              type="button"
              className="h-11 border border-line px-5 font-display text-sm tracking-widest text-fg"
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
              className="inline-flex h-11 items-center gap-2 border border-line bg-surface/80 px-4 font-display text-xs tracking-widest text-fg hover:border-gold"
              onClick={toggleAudio}
            >
              {muted ? <VolumeX className="h-4 w-4 text-blood" /> : <Volume2 className="h-4 w-4 text-gold" />}
              <span>{muted ? "Mudo" : "Música & SFX"}</span>
            </button>
          </div>
          <p className="mt-6 max-w-xl text-sm text-muted">A e D andam. J ataca — segure para carregar. K esquiva para trás. L é a magia. W pula só para desviar.</p>
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
        className="pixel-canvas-fullscreen focus:outline-none"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      />

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
            className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center border border-line bg-surface/80 text-fg hover:border-gold hover:text-gold rounded transition"
            onClick={toggleAudio}
            title={muted ? "Ativar áudio" : "Desativar áudio"}
          >
            {muted ? <VolumeX className="h-4 w-4 text-blood" /> : <Volume2 className="h-4 w-4 text-gold" />}
          </button>
          <button
            type="button"
            className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center border border-line bg-surface/80 text-fg hover:border-gold hover:text-gold rounded transition"
            onClick={toggleFullscreen}
            title={isFullscreen ? "Sair da Tela Cheia" : "Tela Cheia"}
          >
            {isFullscreen ? <Minimize2 className="h-4 w-4 text-gold" /> : <Maximize2 className="h-4 w-4 text-fg" />}
          </button>
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
                  onClick={() => apiRef.current?.reset()}
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
                onClick={() => setMode("stages")}
              >
                Mapa
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
