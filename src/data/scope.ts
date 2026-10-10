export const chapters = [
  { id: "arena", label: "Arena" },
  { id: "visao", label: "Visão" },
  { id: "arte", label: "Arte" },
  { id: "heroi", label: "Herói" },
  { id: "bestiario", label: "Bestiário" },
  { id: "fases", label: "Fases" },
  { id: "hud", label: "HUD" },
  { id: "codigo", label: "Código" },
] as const;

export const decisions = [
  {
    title: "Fases, não um mapa único",
    body: "Sete asas com começo, gimmick e sub-chefe. Um hall-hub as destrava. Atalhos internos existem; um castelo interconectado no estilo mapa-único ficaria fora de um escopo de dificuldade média.",
  },
  {
    title: "O kit de movimento chega cedo",
    body: "Dash, segundo pulo, parede e pogo estão na mão desde a fase 1. A fase ensina; a seguinte exige. Segredos usam o kit, não trancam o caminho crítico atrás de um item tardio.",
  },
  {
    title: "2.5D é parallax, não malha 3D",
    body: "Seis planos, oclusores na frente do herói e luzes em espaço de tela. A câmera nunca gira. Profundidade vem do deslocamento, da névoa e do luar — não de uma cena Three.js.",
  },
  {
    title: "Kernel próprio em vez de Phaser",
    body: "Hitstop, cancelamento em dash, pogo e combo pedem um passo fixo que a gente possui. A fatia abaixo é esse kernel. O jogo completo permanece nele.",
  },
] as const;

export const parallax = [
  { plane: "01 Céu", speed: "0.05", note: "Luaz vermelha, gradiente, sem parallax vertical." },
  { plane: "02 Silhueta", speed: "0.15", note: "Arcos e torres distantes, quase sem detalhe." },
  { plane: "03 Arquitetura", speed: "0.40", note: "Vitrais, estátuas, galeria. Onde mora a cor saturada." },
  { plane: "04 Jogo", speed: "1.00", note: "Tiles 16px, colisão, atores. Único plano com hitbox." },
  { plane: "05 Frente", speed: "1.20", note: "Pilares e névoa que cobrem o herói de leve." },
  { plane: "06 Luz", speed: "tela", note: "Tochas, shafts de luar, vignette. Composite additive." },
] as const;

export const artRules = [
  "Resolução lógica 480×270, escala inteira na tela, nearest-neighbor. Nada de filtrar o pixel.",
  "Contorno de 1px em #140c10, nunca preto puro. Luz consistente vinda do alto-esquerda, mais a tocha mais próxima.",
  "No máximo 32 cores por sprite. O cenário pode usar uma rampa por bioma, mais ouro de tocha e o vermelho da lua — a lua é a mesma em todas as fases.",
  "Saturação alta nos vitrais, no sangue e na magia. Pedra e névoa ficam dessaturadas para a cor pontual gritar, como num cenário de Neo Geo.",
  "Sprites em PNG com alpha real. Sem chroma magenta. Pivô nos pés. Hitbox à parte do desenho.",
] as const;

export const clips = [
  { name: "idle", frames: "6 × 120 ms", event: "Capa e respiração." },
  { name: "run", frames: "8 × 70 ms", event: "Contato no frame 3 e 7: pó." },
  { name: "jump / fall", frames: "3 + 2", event: "Anticipação de 2 frames no agachar, se houver." },
  { name: "dash", frames: "4 × 35 ms", event: "Rastro azul-branco fora da sheet, em VFX." },
  { name: "attack_side_1–3", frames: "6 × 36 ms", event: "Hitbox nos frames 2–3. O 3º golpe é o finisher." },
  { name: "attack_up / down", frames: "5 × 40 ms", event: "Down, no ar, é o pogo." },
  { name: "charge_wind / release", frames: "4 + 6", event: "Onda de luz no release. Sem custo de mana." },
  { name: "spell", frames: "5 × 40 ms", event: "Disparo no frame 3. Gasta mana." },
  { name: "wall", frames: "3 × 90 ms", event: "Loop enquanto desliza." },
  { name: "hurt / death", frames: "3 + 8", event: "Morte não loop. Poeira de cinza." },
] as const;

export const states = [
  "Idle",
  "Run",
  "Rise",
  "Apex",
  "Fall",
  "Double",
  "Dash",
  "Wall",
  "Slash",
  "Charge",
  "Spell",
  "Hurt",
  "Death",
] as const;

export type Family = "Todos" | "Vampiros" | "Gárgulas" | "Morcegos" | "Mortos-vivos";

export type Creature = {
  family: Exclude<Family, "Todos">;
  name: string;
  role: string;
  tell: string;
  attack: string;
};

export const creatures: Creature[] = [
  {
    family: "Vampiros",
    name: "Aristocrata",
    role: "Atirador de média distância",
    tell: "Levanta a mão; o sangue sobe do chão.",
    attack: "Orbe lento de sangue. Teleporte curto se encurralado.",
  },
  {
    family: "Vampiros",
    name: "Duelista",
    role: "Pressiona de perto",
    tell: "Recua o florete por 0,32 s. A lâmina brilha.",
    attack: "Combo de três. Dash atravessando o jogador no finisher.",
  },
  {
    family: "Vampiros",
    name: "Vampira do claustro",
    role: "Controle de área",
    tell: "O chicote de sangue desenha um arco no chão.",
    attack: "Arco horizontal. Abaixo de 40% de vida, vira morcego por 2 s.",
  },
  {
    family: "Gárgulas",
    name: "Sentinela de pedra",
    role: "Emboscada",
    tell: "Estátua até o jogador entrar no raio. Os olhos acendem.",
    attack: "Desperta e esmaga. Armadura de pedra: só o golpe carregado ou o pogo na cabeça quebram a guarda.",
  },
  {
    family: "Gárgulas",
    name: "Gárgula alada",
    role: "Pressão aérea",
    tell: "Abre a asa e paira um instante.",
    attack: "Mergulho diagonal e volta ao poleiro. Punível na subida.",
  },
  {
    family: "Gárgulas",
    name: "Bruto de pedra",
    role: "Tanque de corredor",
    tell: "O punho recua até o ombro.",
    attack: "Soco lento com onda de choque curta. Não persegue escada acima.",
  },
  {
    family: "Morcegos",
    name: "Enxame",
    role: "Harass",
    tell: "O grupo aperta a formação.",
    attack: "Quatro a seis corpos em seno. Cada um morre em um golpe. Empurram o pulo.",
  },
  {
    family: "Morcegos",
    name: "Morcego gigante",
    role: "Sub-chefe aéreo",
    tell: "Grita: o canto escurece as bordas da tela.",
    attack: "Mergulho e vento. Ponto fraco no peito depois do mergulho.",
  },
  {
    family: "Morcegos",
    name: "Morcego de fogo / sombra",
    role: "Variante elemental",
    tell: "O rastro fica no ar por 0,4 s.",
    attack: "Fogo deixa brasas no chão. Sombra atravessa plataformas finas uma vez.",
  },
  {
    family: "Mortos-vivos",
    name: "Cadáver rastejante",
    role: "Pressão baixa",
    tell: "A mão sai do piso um segundo antes.",
    attack: "Agarra o tornozelo se o jogador ficar parado. Dash quebra o agarre.",
  },
  {
    family: "Mortos-vivos",
    name: "Esqueleto de corrente",
    role: "Zona de ameaça",
    tell: "A corrente estala e fica reta.",
    attack: "Giro 360. A corrente é hitbox. Pogo na caveira durante a recuperação.",
  },
];

export const dracula = [
  {
    phase: "I — Aristocrata",
    body: "Teleporte entre três marcas no trono, pilares de sangue e golpe de capa. Janela: 0,8 s depois que o pilar quebra, antes do próximo teleporte.",
  },
  {
    phase: "II — Duelista",
    body: "Três clones. O verdadeiro tem a aura um tom mais quente. Combo de espada; a janela é o fim do terceiro golpe, quando a capa cai.",
  },
  {
    phase: "III — Fera colossal",
    body: "O corpo ocupa a sala. Soco no chão (pular), sopro (dash por baixo ou plataforma). O coração abre por 1,4 s depois do sopro: pogo ou carregado nele.",
  },
] as const;

export const stages = [
  {
    id: 1,
    title: "Os Portões e a Floresta Sombria",
    image: "/art/stage-1.jpg",
    minutes: "8–10 min",
    teaches: "Pulo, ataque lateral, dash no chão.",
    gimmick: "Neblina que esconde o chão dois tiles à frente. Tochas revelam um raio fixo.",
    enemies: "Enxame, um sentinela adormecido no portão.",
    boss: "Petros, a Gárgula do Portão",
    bossMove: "Desperta da ombreira. Dois mergulhos e um terremoto curto.",
    secret: "Pogo numa raiz leva a uma relíquia atrás da grade.",
    swatches: [
      { cls: "sw-1a", label: "Noite" },
      { cls: "sw-1b", label: "Musgo" },
      { cls: "sw-1c", label: "Lua" },
      { cls: "sw-1d", label: "Névoa" },
      { cls: "sw-1e", label: "Tocha" },
    ],
  },
  {
    id: 2,
    title: "Hall de Entrada e Galeria das Gárgulas",
    image: "/art/stage-2.jpg",
    minutes: "10–12 min",
    teaches: "Deslize e chute de parede. A galeria é um poço.",
    gimmick: "Estátuas que acordam se você passar correndo. Andar não as liga.",
    enemies: "Sentinelas, gárgulas aladas, bruto no patamar.",
    boss: "As Sentinelas",
    bossMove: "Par na galeria. Uma mergulha enquanto a outra guarda o poleiro.",
    secret: "Parede esquerda do poço, acima do primeiro arco.",
    swatches: [
      { cls: "sw-2a", label: "Pedra" },
      { cls: "sw-2b", label: "Tapete" },
      { cls: "sw-2c", label: "Vitral" },
      { cls: "sw-2d", label: "Ouro" },
      { cls: "sw-2e", label: "Lua" },
    ],
  },
  {
    id: 3,
    title: "Capela Desconsagrada e Claustro de Sangue",
    image: "/art/stage-3.jpg",
    minutes: "10–12 min",
    teaches: "Magia Luz de Véspera, achada no altar. Mana passa a importar.",
    gimmick: "Shafts de vitral: dano se ficar parado na luz, plataformas de vidro que só existem dentro do facho.",
    enemies: "Aristocratas, vampira, morcegos de sombra.",
    boss: "Seraphine, Sacerdotisa do Claustro",
    bossMove: "Chicote em leque e transformação em morcego. O altar quebra no meio da luta.",
    secret: "Um facho apagado acende com a magia e abre o confessionário.",
    swatches: [
      { cls: "sw-3a", label: "Vinho" },
      { cls: "sw-3b", label: "Vidro" },
      { cls: "sw-3c", label: "Pedra" },
      { cls: "sw-3d", label: "Vela" },
      { cls: "sw-3e", label: "Sombra" },
    ],
  },
  {
    id: 4,
    title: "Catacumbas e Prisão Subterrânea",
    image: "/art/stage-4.jpg",
    minutes: "12 min",
    teaches: "Pogo como ferramenta de rota, não só de dano.",
    gimmick: "Escuridão total fora do lampião. Correntes que são plataformas de um sentido.",
    enemies: "Cadáveres, esqueletos de corrente, enxames, morcego gigante.",
    boss: "Nocturne, Morcego-Rei",
    bossMove: "Mergulhos que derrubam celas. O peito abre após o terceiro mergulho.",
    secret: "Cela sem grade no fundo, atrás de uma corrente falsa.",
    swatches: [
      { cls: "sw-4a", label: "Osso" },
      { cls: "sw-4b", label: "Fumaga" },
      { cls: "sw-4c", label: "Ferro" },
      { cls: "sw-4d", label: "Tocha" },
      { cls: "sw-4e", label: "Breu" },
    ],
  },
  {
    id: 5,
    title: "Biblioteca Proibida e Torre de Vigia",
    image: "/art/stage-5.jpg",
    minutes: "12 min",
    teaches: "Cancelar ataque em dash no meio de duelistas.",
    gimmick: "Vento na torre empurra no ar. Estantes são plataformas que o golpe carregado derruba.",
    enemies: "Duelistas, aristocratas, morcegos de sombra.",
    boss: "Lorde Veyne, Capitão da Torre",
    bossMove: "A leitura de florete do Capitão Morne, com clones de livro.",
    secret: "Estante do terceiro patamar, só pelo pogo a partir do vento.",
    swatches: [
      { cls: "sw-5a", label: "Mogno" },
      { cls: "sw-5b", label: "Violeta" },
      { cls: "sw-5c", label: "Lua" },
      { cls: "sw-5d", label: "Vela" },
      { cls: "sw-5e", label: "Tinta" },
    ],
  },
  {
    id: 6,
    title: "Laboratório de Alquimia e Jardins de Pedra",
    image: "/art/stage-6.jpg",
    minutes: "12 min",
    teaches: "Prioridade de alvo: brasas no chão e estátuas que acordam juntas.",
    gimmick: "Frascos que entornam ácido em ciclo. Sebe de pedra que fecha caminho por 4 s.",
    enemies: "Brutos, gárgulas aladas, morcegos de fogo, cadáveres.",
    boss: "Calx, a Aberração",
    bossMove: "Gárgula experimental: asa de vidro, sopro ácido, núcleo no peito quando a asa quebra.",
    secret: "Jardim interno atrás do ciclo de ácido, no intervalo longo.",
    swatches: [
      { cls: "sw-6a", label: "Azinhavre" },
      { cls: "sw-6b", label: "Vidro" },
      { cls: "sw-6c", label: "Cobre" },
      { cls: "sw-6d", label: "Ouro" },
      { cls: "sw-6e", label: "Pedra" },
    ],
  },
  {
    id: 7,
    title: "Sala do Trono",
    image: "/art/stage-7.jpg",
    minutes: "8 min de luta",
    teaches: "Nada de novo. A luta cobra o kit inteiro.",
    gimmick: "A sala não scrolla. O luar é o telegraph do sopro na fase III.",
    enemies: "Nenhum lixo. Só o mestre.",
    boss: "Drácula, o Último Mestre",
    bossMove: "Três formas: aristocrata, duelista com clones, fera colossal.",
    secret: "Não há. A relíquia final cai do coração.",
    swatches: [
      { cls: "sw-7a", label: "Breu" },
      { cls: "sw-7b", label: "Sangue" },
      { cls: "sw-7c", label: "Aura" },
      { cls: "sw-7d", label: "Ouro" },
      { cls: "sw-7e", label: "Lua" },
    ],
  },
] as const;

export const hudSpec = [
  { name: "Retrato", note: "Aldric, 48px, canto superior esquerdo. Pisca no dano." },
  { name: "Vida", note: "Barra segmentada em 6. Vermelho de sangue. Não é número." },
  { name: "Mana", note: "Faixa sob a vida. A magia custa 28. Regenera 8 por segundo fora do hitstop." },
  { name: "Golpe carregado", note: "Ícone de espada. O anel enche enquanto o botão está preso." },
  { name: "Luz de Véspera", note: "Ícone de chama. Apagado se a mana não paga o custo." },
  { name: "Relíquias", note: "Contador curto. Três por fase, nunca obrigatórias para a porta." },
  { name: "Chefe", note: "Barra no topo, só depois do aggro. Nome em Cinzel, sem subtítulo." },
] as const;

export const modules = [
  { name: "loop", state: "Fatia", note: "requestAnimationFrame, acumulador, passo de 1/60, teto de 0,1 s." },
  { name: "input", state: "Fatia", note: "Ações, não teclas. Teclado, toque e injeção de QA no mesmo conjunto." },
  { name: "player", state: "Fatia", note: "Máquina de estados, coyote, buffer, gravidade assimétrica, dash, parede, pogo." },
  { name: "world", state: "Fatia", note: "AABB. Eixo X, depois Y. Plataforma de um sentido. A fase final usa grid de 16px com a mesma regra." },
  { name: "combat", state: "Fatia", note: "Hitbox separada, hitstop, i-frames, projétil amigo e inimigo." },
  { name: "enemies", state: "Fatia", note: "Morcego, gárgula alada, duelista, capitão. O bestiário completo entra como dados." },
  { name: "render", state: "Fatia", note: "480×270, pixel snap, parallax, luz additive, partículas pooled na prática por teto." },
  { name: "content", state: "Jogo", note: "JSON de tiles e de clips. Uma folha PNG por ator, alpha, pivô nos pés, células de 64." },
  { name: "save", state: "Jogo", note: "localStorage: fase, atalhos, relíquias, vida máxima. Sem conta." },
  { name: "audio", state: "Fatia", note: "WebAudio curto no golpe, dash, magia e dano. O jogo troca por stems orquestrais." },
] as const;

export const pipeline = [
  "Input vira intenção neste quadro: pulo, ataque, dash, magia — borda, não nível.",
  "Hitstop congela física, IA e jogador. Partícula, shake e o flash continuam.",
  "Máquina do herói aplica aceleração, pulo variável, dash ou deslize.",
  "Move em X e resolve sólidos. Depois move em Y. Plataforma de um sentido só se a base vinha de cima.",
  "Inimigos e projéteis. Depois as hitboxes. Um golpe não fere o mesmo alvo duas vezes.",
  "Câmera com zona morta, lookahead na direção do rosto, clamp, snap só na hora de desenhar.",
  "Desenho de trás para frente. Luz por cima, em additive. HUD é DOM, não pixel do mundo.",
] as const;
