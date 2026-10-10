import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { BookOpen, Castle, Crown, Flame, FlaskConical, Layers, Skull, Swords, TreePine } from "lucide-react";
import { ArenaView } from "@/components/arena-view";
import {
  artRules,
  chapters,
  clips,
  creatures,
  decisions,
  dracula,
  hudSpec,
  modules,
  parallax,
  pipeline,
  stages,
  states,
  type Family,
} from "@/data/scope";
import { tuningRows, tuning } from "@/game/tuning";

const families: Family[] = ["Todos", "Vampiros", "Gárgulas", "Morcegos", "Mortos-vivos"];

const stageIcons = [TreePine, Castle, Flame, Skull, BookOpen, FlaskConical, Crown];

export function NightfallPage() {
  const [stageId, setStageId] = useState(1);
  const [family, setFamily] = useState<Family>("Todos");
  const stage = stages[stageId - 1];
  const shown = creatures.filter((c) => family === "Todos" || c.family === family);
  const Icon = stageIcons[stageId - 1];

  return (
    <div>
      <header className="sticky top-0 z-30 border-b border-line bg-bg">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-2">
          <a href="#topo" className="shrink-0 font-display text-sm text-blood">
            Nightfall
          </a>
          <Link to="/" className="inline-flex h-11 shrink-0 items-center px-3 font-display text-xs tracking-widest text-gold">
            Jogar
          </Link>
          <nav className="flex min-w-0 flex-1 gap-1 overflow-x-auto">
            {chapters.map((chapter) => (
              <a
                key={chapter.id}
                href={`#${chapter.id}`}
                className="inline-flex h-11 shrink-0 items-center px-3 font-display text-xs tracking-widest text-muted"
              >
                {chapter.label}
              </a>
            ))}
          </nav>
        </div>
      </header>

      <main id="topo" className="mx-auto max-w-6xl px-4 py-8">
        <p className="font-display text-xs tracking-widest text-gold">Escopo de design e de programação</p>
        <h1 className="brand-title mt-2 font-display text-4xl md:text-6xl">Nightfall Chronicles</h1>
        <p className="mt-4 max-w-3xl text-lg text-fg">
          Plataforma de ação em rolagem lateral. Estrutura de fases à Castlevania, movimento à Hollow Knight, pintura de pixel à Neo Geo. Sete asas, dificuldade média, um único mestre no trono.
        </p>
        <dl className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
          {[
            ["Formato", "2.5D lateral"],
            ["Fases", "7, com hub"],
            ["Dificuldade", "Média"],
            ["Herói", "Aldric Vale"],
          ].map(([k, v]) => (
            <div key={k} className="border border-line bg-surface px-3 py-3">
              <dt className="text-xs text-muted">{k}</dt>
              <dd className="font-display text-sm text-fg">{v}</dd>
            </div>
          ))}
        </dl>
      </main>

      <section id="arena" className="mx-auto max-w-6xl px-4 pb-12">
        <PlateHead index="01" kicker="Fatia jogável" title="O feel antes do resto do castelo" />
        <p className="mb-4 max-w-3xl text-muted">
          A antecâmara usa o mesmo kernel descrito na prancha de código: passo fixo, coyote, buffer, gravidade assimétrica, dash com esquiva curta, parede, pogo e golpe carregado. Os números da tabela de feel são estes, não uma estimativa.
        </p>
        <ArenaView />
      </section>

      <section id="visao" className="border-t border-line">
        <div className="mx-auto max-w-6xl px-4 py-12">
          <PlateHead index="02" kicker="Visão" title="O que o jogo é, e o que ele recusa" />
          <div className="grid gap-4 md:grid-cols-2">
            {decisions.map((item) => (
              <article key={item.title} className="border border-line bg-surface p-4">
                <h3 className="font-display text-lg text-fg">{item.title}</h3>
                <p className="mt-2 text-muted">{item.body}</p>
              </article>
            ))}
          </div>
          <figure className="mt-6 border border-line bg-surface">
            <img src="/art/concept-sheet.jpg" alt="Prancha de referência de Nightfall Chronicles: herói, vampiros, gárgulas, morcegos e a sala do trono." className="w-full" />
            <figcaption className="px-3 py-2 text-sm text-muted">Prancha de referência. O escopo abaixo fecha o que ela deixa em aberto.</figcaption>
          </figure>
        </div>
      </section>

      <section id="arte" className="border-t border-line">
        <div className="mx-auto max-w-6xl px-4 py-12">
          <PlateHead index="03" kicker="Direção de arte" title="Pixel saturado, pedra quieta, lua sempre vermelha" />
          <div className="grid gap-8 md:grid-cols-[1.1fr_0.9fr]">
            <div>
              <ul className="space-y-3">
                {artRules.map((rule) => (
                  <li key={rule} className="border-l-2 border-blood pl-3 text-muted">
                    {rule}
                  </li>
                ))}
              </ul>
              <h3 className="mt-8 font-display text-lg">Seis planos</h3>
              <div className="mt-3 overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="text-gold">
                    <tr>
                      <th className="py-2 pr-3 font-normal">Plano</th>
                      <th className="py-2 pr-3 font-normal">Fator</th>
                      <th className="py-2 font-normal">Função</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parallax.map((row) => (
                      <tr key={row.plane} className="border-t border-line">
                        <td className="py-2 pr-3 text-fg">{row.plane}</td>
                        <td className="py-2 pr-3 tabular-nums text-muted">{row.speed}</td>
                        <td className="py-2 text-muted">{row.note}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <figure className="border border-line">
              <img src="/art/stage-2.jpg" alt="Hall de entrada com vitral, tapete vermelho e gárgulas de pedra." className="aspect-video w-full object-cover" />
              <figcaption className="bg-surface px-3 py-2 text-sm text-muted">Hall. A cor mora no vitral e no tapete. A pedra fica baixa.</figcaption>
            </figure>
          </div>
          <h3 className="mt-10 font-display text-lg">Folhas de animação</h3>
          <p className="mt-2 max-w-3xl text-muted">
            Cada ator: um PNG com alpha e um JSON. Células de 64. Pivô em (32, 60), nos pés. O desenho não carrega a hitbox. Efeitos de lâmina, rastro e poeira ficam numa folha à parte, desenhada por cima.
          </p>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-gold">
                <tr>
                  <th className="py-2 pr-3 font-normal">Clip</th>
                  <th className="py-2 pr-3 font-normal">Duração</th>
                  <th className="py-2 font-normal">Evento</th>
                </tr>
              </thead>
              <tbody>
                {clips.map((clip) => (
                  <tr key={clip.name} className="border-t border-line">
                    <td className="py-2 pr-3 text-fg">{clip.name}</td>
                    <td className="py-2 pr-3 text-muted">{clip.frames}</td>
                    <td className="py-2 text-muted">{clip.event}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section id="heroi" className="border-t border-line">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 md:grid-cols-[0.7fr_1.3fr]">
          <figure className="border border-line bg-surface">
            <img src="/art/hero.jpg" alt="Aldric Vale, espadachim de capa escura e armadura de prata." className="aspect-[2/3] w-full object-cover object-top" />
            <figcaption className="px-3 py-2 text-sm text-muted">Aldric Vale. Caçador da Casa Vale. A capa é o rastro da silhueta.</figcaption>
          </figure>
          <div>
            <PlateHead index="04" kicker="Herói" title="Movimento que perdoa, golpe que não" />
            <p className="text-muted">
              A máquina não espera a folha de sprite. Os estados abaixo já rodam na antecâmara. O pulo usa coyote de {tuning.coyote}s, buffer de {tuning.jumpBuffer}s e corta a subida quando o botão solta. Cair pesa mais do que subir. No ápice a gravidade alivia.
            </p>
            <ul className="mt-4 flex flex-wrap gap-2">
              {states.map((state) => (
                <li key={state} className="border border-line px-2 py-1 font-display text-xs tracking-widest text-fg">
                  {state}
                </li>
              ))}
            </ul>
            <div className="mt-6 overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="text-gold">
                  <tr>
                    <th className="py-2 pr-3 font-normal">Constante</th>
                    <th className="py-2 pr-3 font-normal">Valor</th>
                    <th className="py-2 font-normal">Unidade</th>
                  </tr>
                </thead>
                <tbody>
                  {tuningRows.map((row) => (
                    <tr key={row.key} className="border-t border-line">
                      <td className="py-2 pr-3 text-fg">{row.label}</td>
                      <td className="py-2 pr-3 tabular-nums text-gold">{tuning[row.key]}</td>
                      <td className="py-2 text-muted">{row.unit}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      <section id="bestiario" className="border-t border-line">
        <div className="mx-auto max-w-6xl px-4 py-12">
          <PlateHead index="05" kicker="Bestiário" title="Três casas, mais os que a terra não solta" />
          <div className="grid gap-6 md:grid-cols-[1fr_1fr]">
            <figure className="border border-line">
              <img src="/art/bestiary.jpg" alt="Vampiro duelista, gárgula de pedra e enxame de morcegos." className="aspect-video w-full object-cover" />
              <figcaption className="bg-surface px-3 py-2 text-sm text-muted">Duelista, gárgula alada, enxame. Cada um tem um telegraph legível.</figcaption>
            </figure>
            <figure className="border border-line">
              <img src="/art/dracula.jpg" alt="Drácula, o Último Mestre, de capa carmesim e aura violeta." className="aspect-[2/3] max-h-80 w-full object-cover object-top md:max-h-none" />
              <figcaption className="bg-surface px-3 py-2 text-sm text-muted">Drácula, fase I. A fera da fase III não cabe neste retrato.</figcaption>
            </figure>
          </div>
          <div className="mt-6 flex gap-2 overflow-x-auto">
            {families.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setFamily(item)}
                className={
                  item === family
                    ? "h-11 shrink-0 border border-blood bg-blood px-3 font-display text-xs tracking-widest text-fg"
                    : "h-11 shrink-0 border border-line px-3 font-display text-xs tracking-widest text-muted"
                }
              >
                {item}
              </button>
            ))}
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {shown.map((creature) => (
              <article key={creature.name} className="border border-line bg-surface p-4">
                <p className="text-xs text-gold">{creature.family}</p>
                <h3 className="font-display text-lg">{creature.name}</h3>
                <p className="text-sm text-muted">{creature.role}</p>
                <p className="mt-2 text-sm text-fg">Telegraph: {creature.tell}</p>
                <p className="mt-1 text-sm text-muted">{creature.attack}</p>
              </article>
            ))}
          </div>
          <div className="mt-6 grid gap-3 md:grid-cols-3">
            {dracula.map((phase) => (
              <article key={phase.phase} className="border border-line p-4">
                <h3 className="flex items-center gap-2 font-display text-lg">
                  <Swords className="size-4 text-blood" aria-hidden />
                  {phase.phase}
                </h3>
                <p className="mt-2 text-sm text-muted">{phase.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="fases" className="border-t border-line">
        <div className="mx-auto max-w-6xl px-4 py-12">
          <PlateHead index="06" kicker="Sete fases" title="Uma asa por prancha, um sub-chefe por asa" />
          <div className="grid gap-6 md:grid-cols-[16rem_1fr]">
            <div className="flex gap-2 overflow-x-auto md:flex-col md:overflow-visible">
              {stages.map((item, index) => {
                const StageIcon = stageIcons[index];
                const on = item.id === stageId;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setStageId(item.id)}
                    className={
                      on
                        ? "flex h-11 shrink-0 items-center gap-2 border border-blood bg-blood px-3 text-left font-display text-xs tracking-wide text-fg md:w-full"
                        : "flex h-11 shrink-0 items-center gap-2 border border-line px-3 text-left font-display text-xs tracking-wide text-muted md:w-full"
                    }
                  >
                    <StageIcon className="size-4 shrink-0" aria-hidden />
                    <span className="tabular-nums">{item.id}</span>
                    <span className="truncate">{item.title}</span>
                  </button>
                );
              })}
            </div>
            <article className="border border-line bg-surface">
              <img src={stage.image} alt="" className="aspect-video w-full object-cover" />
              <div className="p-4">
                <p className="flex items-center gap-2 font-display text-xs tracking-widest text-gold">
                  <Icon className="size-4" aria-hidden />
                  Fase {stage.id} · {stage.minutes}
                </p>
                <h3 className="mt-2 font-display text-2xl">{stage.title}</h3>
                <dl className="mt-4 grid gap-3 text-sm md:grid-cols-2">
                  <div>
                    <dt className="text-gold">Ensina</dt>
                    <dd className="text-muted">{stage.teaches}</dd>
                  </div>
                  <div>
                    <dt className="text-gold">Gimmick</dt>
                    <dd className="text-muted">{stage.gimmick}</dd>
                  </div>
                  <div>
                    <dt className="text-gold">Inimigos</dt>
                    <dd className="text-muted">{stage.enemies}</dd>
                  </div>
                  <div>
                    <dt className="text-gold">Segredo</dt>
                    <dd className="text-muted">{stage.secret}</dd>
                  </div>
                </dl>
                <p className="mt-4 text-fg">
                  <span className="text-gold">{stage.boss}. </span>
                  {stage.bossMove}
                </p>
                <ul className="mt-4 flex gap-2">
                  {stage.swatches.map((swatch) => (
                    <li key={swatch.cls} className="text-center">
                      <span className={`swatch ${swatch.cls} block`} />
                      <span className="mt-1 block text-xs text-muted">{swatch.label}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </article>
          </div>
        </div>
      </section>

      <section id="hud" className="border-t border-line">
        <div className="mx-auto max-w-6xl px-4 py-12">
          <PlateHead index="07" kicker="Interface" title="Compacta, no topo, fora do caminho da lâmina" />
          <div className="grid gap-3 md:grid-cols-2">
            {hudSpec.map((item) => (
              <article key={item.name} className="border border-line bg-surface p-4">
                <h3 className="font-display text-lg">{item.name}</h3>
                <p className="mt-1 text-sm text-muted">{item.note}</p>
              </article>
            ))}
          </div>
          <p className="mt-4 flex items-center gap-2 text-sm text-muted">
            <Layers className="size-4 text-gold" aria-hidden />
            O HUD da fatia é DOM sobre o canvas. O jogo final pode pintá-lo em pixel, com a mesma hierarquia.
          </p>
        </div>
      </section>

      <section id="codigo" className="border-t border-line">
        <div className="mx-auto max-w-6xl px-4 py-12">
          <PlateHead index="08" kicker="Programação" title="Um passo, dois eixos, hitbox fora do desenho" />
          <ol className="space-y-2">
            {pipeline.map((step, index) => (
              <li key={step} className="flex gap-3 border border-line bg-surface p-3">
                <span className="font-display text-gold tabular-nums">0{index + 1}</span>
                <span className="text-muted">{step}</span>
              </li>
            ))}
          </ol>
          <div className="mt-6 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-gold">
                <tr>
                  <th className="py-2 pr-3 font-normal">Módulo</th>
                  <th className="py-2 pr-3 font-normal">Onde</th>
                  <th className="py-2 font-normal">Contrato</th>
                </tr>
              </thead>
              <tbody>
                {modules.map((mod) => (
                  <tr key={mod.name} className="border-t border-line">
                    <td className="py-2 pr-3 text-fg">{mod.name}</td>
                    <td className="py-2 pr-3 text-gold">{mod.state}</td>
                    <td className="py-2 text-muted">{mod.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-6 max-w-3xl text-muted">
            Resolução lógica {tuning.viewW}×{tuning.viewH}. Colisão separa o eixo X do eixo Y. Plataforma fina só segura quem vinha de cima. Save futuro em localStorage, sem conta. Áudio da fatia é síntese curta; o jogo troca por stems.
          </p>
        </div>
      </section>

      <footer className="border-t border-line px-4 py-8 text-center text-sm text-muted">
        Nightfall Chronicles. A campanha jogável está na tela inicial. Esta prancha guarda o escopo.
      </footer>
    </div>
  );
}

function PlateHead({ index, kicker, title }: { index: string; kicker: string; title: string }) {
  return (
    <div className="mb-4">
      <p className="font-display text-xs tracking-widest text-gold">
        {index} · {kicker}
      </p>
      <h2 className="mt-1 font-display text-2xl text-fg md:text-3xl">{title}</h2>
    </div>
  );
}
