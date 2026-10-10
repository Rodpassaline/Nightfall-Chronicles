import { useEffect, useRef, useState, type PointerEvent } from "react";
import { Volume2, VolumeX } from "lucide-react";
import { mountArena, type ArenaApi, type HudSnap } from "@/game/arena";
import { sound } from "@/game/audio";

const empty: HudSnap = {
  hp: 6,
  maxHp: 6,
  mana: 100,
  maxMana: 100,
  relics: 0,
  relicsMax: 3,
  bossHp: 16,
  bossMax: 16,
  bossName: "Capitão Morne",
  bossOn: false,
  toast: "",
  won: false,
  dead: false,
  dashReady: true,
  charge: 0,
  clears: 0,
};

const pads = [
  { action: "left", label: "Esquerda" },
  { action: "right", label: "Direita" },
  { action: "aimDown", label: "Baixo" },
  { action: "aimUp", label: "Cima" },
  { action: "jump", label: "Pulo" },
  { action: "attack", label: "Ataque" },
  { action: "dash", label: "Dash" },
  { action: "spell", label: "Magia" },
] as const;

type PadAction = (typeof pads)[number]["action"];

export function ArenaView() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const apiRef = useRef<ArenaApi | null>(null);
  const [hud, setHud] = useState<HudSnap>(empty);
  const [muted, setMuted] = useState(() => sound.isMuted());

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const api = mountArena(canvas, setHud);
    apiRef.current = api;
    return () => {
      api.destroy();
      sound.stopBgm();
      apiRef.current = null;
    };
  }, []);

  const toggleAudio = () => {
    const next = sound.toggleMute();
    setMuted(next);
    if (!next) sound.playBgm("castle");
  };

  const press = (action: PadAction, down: boolean) => (event: PointerEvent<HTMLButtonElement>) => {
    if (down) {
      event.preventDefault();
      event.currentTarget.setPointerCapture(event.pointerId);
      if (!sound.isMuted() && sound.getCurrentTrack() === "none") {
        sound.playBgm("castle");
      }
    }
    apiRef.current?.setHeld(action, down);
  };

  return (
    <div data-arena className="border border-line bg-surface">
      <div className="flex items-center justify-between gap-3 border-b border-line px-3 py-2">
        <p className="font-display text-xs tracking-widest text-gold">Antecâmara do trono</p>
        <div className="flex items-center gap-3">
          <button
            type="button"
            className="inline-flex items-center gap-1 border border-line px-2 py-0.5 text-xs text-muted hover:text-fg"
            onClick={toggleAudio}
            title={muted ? "Ativar áudio" : "Desativar áudio"}
          >
            {muted ? <VolumeX className="h-3.5 w-3.5 text-blood" /> : <Volume2 className="h-3.5 w-3.5 text-gold" />}
            <span>{muted ? "Mudo" : "Som"}</span>
          </button>
          <p className="text-xs text-muted tabular-nums">{hud.clears > 0 ? `${hud.clears} passagens` : "Fatia vertical"}</p>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-3 px-3 py-3">
        <img src="/art/hero.jpg" alt="" className="h-12 w-12 border border-line object-cover object-top" />
        <div className="min-w-40 flex-1">
          <p className="mb-1 font-display text-xs tracking-widest text-fg">Aldric Vale</p>
          <div className="mb-1 flex gap-1">
            {Array.from({ length: hud.maxHp }, (_, i) => (
              <span key={i} className={i < hud.hp ? "h-2 flex-1 bg-blood" : "h-2 flex-1 bg-surface-2"} />
            ))}
          </div>
          <div className="h-1.5 bg-surface-2">
            <div className="h-full bg-gold" style={{ width: `${(hud.mana / hud.maxMana) * 100}%` }} />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Mini label="Espada" value={hud.charge} />
          <Mini label="Magia" value={hud.mana / hud.maxMana} dim={hud.mana < 28} />
          <p className="font-display text-sm text-gold tabular-nums">
            {hud.relics}/{hud.relicsMax}
          </p>
        </div>
        {hud.bossOn ? (
          <div className="w-full">
            <p className="font-display text-xs tracking-widest text-fg">{hud.bossName}</p>
            <div className="mt-1 h-2 bg-surface-2">
              <div className="h-full bg-blood" style={{ width: `${(hud.bossHp / Math.max(1, hud.bossMax)) * 100}%` }} />
            </div>
          </div>
        ) : null}
      </div>
      <canvas
        ref={canvasRef}
        width={480}
        height={270}
        tabIndex={0}
        aria-label="Arena jogável da antecâmara. Clique para usar o teclado, ou os botões abaixo."
        className="pixel-canvas"
      />
      <div className="flex items-center justify-between gap-3 border-t border-line px-3 py-2">
        <p className="text-sm text-muted">{hud.toast || "Derrote Morne e toque o portão dourado."}</p>
        <button
          type="button"
          className="h-11 shrink-0 border border-line px-3 font-display text-xs tracking-widest text-fg"
          onClick={() => apiRef.current?.reset()}
        >
          Recomeçar
        </button>
      </div>
      <div className="grid grid-cols-4 gap-1 border-t border-line p-2">
        {pads.map((pad) => (
          <button
            key={pad.action}
            type="button"
            className="h-11 border border-line bg-bg font-display text-xs tracking-wide text-fg"
            onPointerDown={press(pad.action, true)}
            onPointerUp={press(pad.action, false)}
            onPointerCancel={press(pad.action, false)}
            onLostPointerCapture={press(pad.action, false)}
          >
            {pad.label}
          </button>
        ))}
      </div>
      <p className="px-3 py-3 text-sm text-muted">
        Clique na arena. A e D movem, W ou Espaço pulam, J ataca, segure J para carregar, K ou Shift dão o dash, L é a magia. Seta para cima junto do ataque sobe a lâmina. S no ar e J quicam. S e pulo atravessam a plataforma fina. Esc solta o teclado.
      </p>
    </div>
  );
}

function Mini({ label, value, dim }: { label: string; value: number; dim?: boolean }) {
  const width = `${Math.max(0, Math.min(1, value)) * 100}%`;
  return (
    <div className={dim ? "w-14 opacity-50" : "w-14"}>
      <p className="text-xs text-muted">{label}</p>
      <div className="h-1.5 bg-surface-2">
        <div className="h-full bg-fg" style={{ width }} />
      </div>
    </div>
  );
}
