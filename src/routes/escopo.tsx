import { createFileRoute } from "@tanstack/react-router";
import { NightfallPage } from "@/components/nightfall-page";

export const Route = createFileRoute("/escopo")({
  component: NightfallPage,
  head: () => ({
    meta: [
      { title: "Escopo · Nightfall Chronicles" },
      {
        name: "description",
        content: "Prancha de design e programação de Nightfall Chronicles, com a antecâmara de prova de movimento.",
      },
    ],
  }),
});
