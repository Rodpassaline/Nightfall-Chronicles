import { createFileRoute } from "@tanstack/react-router";
import { GameScreen } from "@/components/game-screen";

export const Route = createFileRoute("/")({
  component: GameScreen,
  head: () => ({
    meta: [
      { title: "Nightfall Chronicles" },
      {
        name: "description",
        content: "Campanha jogável de Nightfall Chronicles: sete fases em pixel art Neo Geo, com dash, parede, pogo e Drácula no trono.",
      },
    ],
  }),
});
