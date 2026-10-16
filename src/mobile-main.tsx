import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { GameScreen } from "@/components/game-screen";
import "./styles.css";

const rootEl = document.getElementById("root");
if (rootEl) {
  createRoot(rootEl).render(
    <StrictMode>
      <GameScreen />
    </StrictMode>,
  );
}
