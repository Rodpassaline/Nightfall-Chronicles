import { useEffect, useState, useCallback } from "react";
import { sound } from "@/game/audio";
import { Sword, Skull, Sparkles, ChevronRight } from "lucide-react";

export interface StageIntroMeta {
  id: number;
  roman: string;
  title: string;
  place: string;
  bossName: string;
  bossTitle: string;
  image: string;
  quote?: string;
  objective: string;
}

export const STAGE_INTROS: Record<number, StageIntroMeta> = {
  1: {
    id: 1,
    roman: "I",
    title: "OS PORTÕES",
    place: "Pátio dos Portões & Muralhas Ancestrais",
    bossName: "Petros",
    bossTitle: "A Gárgula Colossal",
    image: "/art/stage-1.jpg",
    quote: "Nenhum mortal cruzará os portões do Mestre!",
    objective: "Atravesse o cemitério e rompa os portões ancestrais.",
  },
  2: {
    id: 2,
    roman: "II",
    title: "GALERIA DE MÁRMORE",
    place: "Coliseu Imperial & Galeria de Mármore",
    bossName: "Valerius",
    bossTitle: "O Cavaleiro Imortal",
    image: "/art/stage-2.jpg",
    quote: "Sua jornada tola termina sob o fio desta lâmina!",
    objective: "Supere os gladiadores e derrube a sentinela de ferro.",
  },
  3: {
    id: 3,
    roman: "III",
    title: "CAPELA DESCONSAGRADA",
    place: "Claustro dos Vitrais & Altar Sagrado",
    bossName: "Seraphine",
    bossTitle: "Sacerdotisa do Claustro",
    image: "/art/stage-3.jpg",
    quote: "Seu sangue alimentará este santuário sagrado...",
    objective: "Purifique o templo profanado pelas chamas das trevas.",
  },
  4: {
    id: 4,
    roman: "IV",
    title: "CATACUMBAS PROFUNDAS",
    place: "Masmorras Subterrâneas & Criptas",
    bossName: "Nocturne",
    bossTitle: "O Morcego-Rei",
    image: "/art/stage-4.jpg",
    quote: "Eu sinto o terror em sua carne nas trevas!",
    objective: "Desça pelas correntes e derrote o soberano alado da noite.",
  },
  5: {
    id: 5,
    roman: "V",
    title: "BIBLIOTECA PROIBIDA",
    place: "Torre dos Tomos & Arquivos Arcanos",
    bossName: "Lorde Veyne",
    bossTitle: "Capitão da Torre",
    image: "/art/stage-5.jpg",
    quote: "As sombras da biblioteca devorarão sua alma!",
    objective: "Suba os andares arcanos e vença os duelistas imortais.",
  },
  6: {
    id: 6,
    roman: "VI",
    title: "LABORATÓRIO DE ALQUIMIA",
    place: "Câmara das Transmutações & Caldeirões",
    bossName: "Calx",
    bossTitle: "A Aberração de Vidro",
    image: "/art/stage-6.jpg",
    quote: "O elixir eterno exige o seu sacrifício!",
    objective: "Neutralize os caldeirões de ácido e destrua a aberração mutante.",
  },
  7: {
    id: 7,
    roman: "VII",
    title: "SALA DO TRONO",
    place: "O Santuário do Último Mestre",
    bossName: "Conde Drácula",
    bossTitle: "O Senhor Supremo da Noite",
    image: "/art/stage-7.jpg",
    quote: "O que é um homem senão uma miserável pilha de segredos?!",
    objective: "A batalha decisiva pela humanidade. Destrua o Conde Drácula!",
  },
};

interface StageIntroCardProps {
  stageId: number;
  onDismiss: () => void;
}

export function StageIntroCard({ stageId, onDismiss }: StageIntroCardProps) {
  const [isClosing, setIsClosing] = useState(false);

  const meta = STAGE_INTROS[stageId] || STAGE_INTROS[1];

  const handleClose = useCallback(() => {
    if (isClosing) return;
    setIsClosing(true);
    setTimeout(() => {
      onDismiss();
    }, 280);
  }, [isClosing, onDismiss]);

  // Efeito sonoro gótico ao surgir o card
  useEffect(() => {
    if (stageId === 7) {
      sound.playSfx("thunder");
    } else {
      sound.playSfx("bell");
    }
  }, [stageId]);

  // Teclado: Espaço, Enter, Esc ou qualquer tecla fecha e inicia a fase
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      e.stopPropagation();
      handleClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [handleClose]);


  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Início da Fase ${stageId}: ${meta.title}`}
      className={`fixed inset-0 z-50 flex items-center justify-center select-none cursor-pointer overflow-hidden transition-all duration-300 ${
        isClosing ? "opacity-0 scale-102" : "opacity-100 scale-100"
      }`}
      onClick={handleClose}
    >
      {/* 1. Backdrop HD Artwork with Gothic Dimming */}
      <div className="absolute inset-0 z-0 bg-black overflow-hidden">
        <img
          src={meta.image}
          alt=""
          className="h-full w-full object-cover transform scale-105 transition-transform duration-3000 ease-out"
        />
        {/* Cinematic Vignette Layers */}
        <div className="absolute inset-0 bg-black/65 backdrop-blur-[3px]" />
        <div className="absolute inset-0 bg-radial-[circle_at_center,transparent_20%,rgba(0,0,0,0.92)_100%]" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/85" />
      </div>

      {/* 2. Ornate Gothic Stage Title Modal */}
      <div
        className="relative z-10 w-full max-w-xl mx-4 rounded-lg border-2 border-gold/60 bg-black/85 p-6 sm:p-9 shadow-[0_0_50px_rgba(0,0,0,0.95),0_0_20px_rgba(226,162,58,0.25)] backdrop-blur-md text-center transform transition-all duration-300"
        onClick={(e) => {
          e.stopPropagation();
          handleClose();
        }}
      >
        {/* Top Ornate Header Badge */}
        <div className="inline-flex items-center gap-2 rounded-full border border-gold/50 bg-black/90 px-4 py-1.5 shadow-md">
          <Sparkles className="h-3.5 w-3.5 text-gold animate-pulse" />
          <span className="font-display text-xs sm:text-sm font-bold tracking-[0.25em] text-gold uppercase">
            ✦ FASE {meta.roman} ✦
          </span>
          <Sparkles className="h-3.5 w-3.5 text-gold animate-pulse" />
        </div>

        {/* Stage Name (Crisp, High-Resolution Typography) */}
        <h1 className="mt-4 font-display text-3xl sm:text-5xl text-white font-bold tracking-widest drop-shadow-[0_4px_20px_rgba(0,0,0,1)] uppercase">
          {meta.title}
        </h1>

        {/* Location Subtitle */}
        <p className="mt-1.5 font-display text-xs sm:text-sm tracking-wider text-gold/90 italic">
          {meta.place}
        </p>

        {/* Ornate Divider with Ruby */}
        <div className="my-5 flex items-center justify-center gap-3">
          <div className="h-px w-20 sm:w-28 bg-gradient-to-r from-transparent via-gold to-gold/80" />
          <div className="h-2 w-2 rotate-45 border border-gold bg-blood shadow-[0_0_8px_rgba(180,35,48,0.9)]" />
          <div className="h-px w-20 sm:w-28 bg-gradient-to-l from-transparent via-gold to-gold/80" />
        </div>

        {/* Boss / Guardian Information Box */}
        <div className="rounded border border-line bg-surface/75 p-3.5 sm:p-4 text-left shadow-inner">
          <div className="flex items-center justify-between gap-2 border-b border-line/60 pb-2">
            <div className="flex items-center gap-2">
              <Skull className="h-4 w-4 text-blood" />
              <span className="font-display text-[11px] sm:text-xs text-gold/90 font-semibold tracking-wider uppercase">
                Guardião da Fase
              </span>
            </div>
            <span className="font-display text-xs text-fg font-bold tracking-wide">
              {meta.bossName}
            </span>
          </div>

          <div className="mt-2.5 flex items-start gap-2">
            <Sword className="h-3.5 w-3.5 text-muted shrink-0 mt-0.5" />
            <p className="text-xs sm:text-sm font-body text-slate-200 leading-snug">
              {meta.objective}
            </p>
          </div>

          {meta.quote ? (
            <p className="mt-2 text-[11px] sm:text-xs font-display text-amber-300/80 italic border-l-2 border-blood pl-2">
              “{meta.quote}”
            </p>
          ) : null}
        </div>

        {/* Quick Start CTA Button */}
        <div className="mt-6 flex flex-col gap-2.5">
          <button
            type="button"
            className="w-full h-12 bg-gradient-to-r from-blood via-red-800 to-blood hover:from-red-700 hover:to-red-800 border-2 border-gold font-display text-sm sm:text-base tracking-widest text-white rounded shadow-[0_0_25px_rgba(180,35,48,0.7)] hover:scale-102 active:scale-98 transition-all flex items-center justify-center gap-2.5 cursor-pointer"
            onClick={handleClose}
          >
            <Sword className="h-4 w-4 text-gold" />
            <span>INICIAR FASE</span>
            <ChevronRight className="h-4 w-4 text-gold animate-bounce" />
          </button>

          <span className="text-[11px] font-display text-gold/90 tracking-wider">
            [ Clique em INICIAR FASE ou pressione ESPAÇO / ENTER ]
          </span>
        </div>
      </div>
    </div>
  );
}
