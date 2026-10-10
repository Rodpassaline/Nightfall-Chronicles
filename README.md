# Nightfall Chronicles

> **Um jogo de ação e plataforma 2.5D sombrio inspirado no clássico estilo gótico de *Castlevania: Symphony of the Night*.**

---

## ⚔️ Sobre o Jogo

**Nightfall Chronicles** transporta o jogador para um reino mergulhado em trevas eternas, onde o castelo ancestral de Drácula despertou mais uma vez. Armado com sua lâmina e artes arcanas proibidas, cabe a você atravessar sete alas mortais, derrotar os generais da noite e enfrentar o Lorde dos Vampiros em sua câmara suprema.

---

## 🏰 As 7 Fases do Castelo

1. **Fase 1 · Os Portões do Castelo**: O cemitério enevoado, muralhas rompidas e portões de ferro batido sob a lua cheia.
2. **Fase 2 · Galeria de Mármore**: Coliseu em ruínas, pilares partidos e colunatas romanas tomadas por gladiadores espectrais.
3. **Fase 3 · Capela Real**: Vitrais sagrados, bancos entalhados e lustres suspensos em uma penumbra catedralícia.
4. **Fase 4 · Catacumbas Subterrâneas**: Celas esquecidas, sarcófagos milenares e correntes no fundo do abismo.
5. **Fase 5 · Biblioteca Proibida**: Estantes repletas de tomos arcanos, globos celestes e galerias ocultas.
6. **Fase 6 · Laboratório de Alquimia**: Alambiques borbulhantes, caldeirões incandescentes e cristais arcanos mutantes.
7. **Fase 7 · Sala do Trono**: A câmara real de veludo carmesim e obsidiana, onde Drácula aguarda em seu trono supremo.

---

## 🎮 Controles

### Teclado (PC)
| Ação | Teclas |
| :--- | :--- |
| **Mover** | `A` / `D` ou `Setas Esquerda / Direita` |
| **Pular / Salto Duplo** | `Espaço` ou `W` ou `Seta Cima` |
| **Ataque de Espada** | `J` ou `Z` |
| **Ataque para Cima** | `W` + `J` / `Z` |
| **Ataque para Baixo (Pogo)** | `S` + `J` / `Z` no ar |
| **Dash / Esquiva (I-Frames)** | `K` ou `Shift` |
| **Disparo de Magia** | `L` ou `F` |
| **Guarda / Bloqueio** | `I` ou `C` |
| **Agachar / Descer Plataforma**| `S` ou `Seta Baixo` |

### Dispositivos Móveis / Touch
- O jogo adapta-se automaticamente a qualquer tela (fullscreen responsivo) com suporte a toques e gestos fluidos.

---

## 🛠️ Tecnologias Utilizadas

- **Engine Gráfica**: HTML5 Canvas 2D com renderização de sub-pixels, iluminação dinâmica e vinheta radial cinematográfica.
- **Profundidade 2.5D**: Sistema multi-camada de parallax com planos de fundo distantes, arquitetura média, plano principal de colisão e elementos de primeiro plano dinâmicos.
- **Framework & Tooling**: [React 19](https://react.dev/), [Vite](https://vitejs.dev/), [TypeScript](https://www.typescriptlang.org/), [Tailwind CSS v4](https://tailwindcss.com/).
- **Áudio**: Sistema de áudio procedural Web Audio API com sintetizadores FM retrô e trilhas sonoras dedicadas para cada ambiente e batalha de chefe.

---

## 🚀 Como Executar Localmente

### Pré-requisitos
- [Node.js](https://nodejs.org/) versão 20 ou superior.
- [npm](https://www.npmjs.com/) instalado.

### Instalação

```bash
# Clone o repositório
git clone https://github.com/Rodpassaline/Nightfall-Chronicles.git

# Acesse a pasta do projeto
cd Nightfall-Chronicles

# Instale as dependências
npm install

# Inicie o servidor de desenvolvimento
npm run dev
```

Abra o navegador em `http://localhost:8080` para jogar.

### Build de Produção

```bash
# Executar verificação de tipos
npm run typecheck

# Gerar build otimizado para deploy
npm run build
```

---

## 📜 Licença

Distribuído sob a licença MIT. Consulte `LICENSE` para mais detalhes.
