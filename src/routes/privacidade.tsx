import { createFileRoute, Link } from "@tanstack/react-router";
import { Shield, ArrowLeft, Copy, Check, ExternalLink, Moon } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/privacidade")({
  component: PrivacyPage,
  head: () => ({
    meta: [
      { title: "Política de Privacidade — Nightfall Chronicles" },
      {
        name: "description",
        content: "Política de Privacidade oficial de Nightfall Chronicles (com.nightfall.chronicles). Informações completas sobre privacidade, ausência de coleta de dados pessoais e conformidade com Google Play e LGPD.",
      },
    ],
  }),
});

function PrivacyPage() {
  const [copied, setCopied] = useState(false);

  const handleCopyLink = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <div className="relative min-h-screen bg-[#09080d] text-[#eae5dc] font-serif py-8 px-4 sm:px-6 lg:px-8 selection:bg-red-900 selection:text-white">
      {/* Background ambience */}
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_50%_0%,#1c1428_0%,#09080d_70%)] opacity-80" />

      <div className="relative z-10 max-w-4xl mx-auto bg-[#121018] border border-[#262232] rounded-xl p-6 sm:p-10 shadow-[0_10px_40px_rgba(0,0,0,0.8)]">
        {/* Navigation & Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-[#262232]">
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-4 py-2 rounded bg-black/60 border border-[#3a344d] hover:border-gold hover:text-gold text-xs font-display tracking-widest uppercase transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Voltar ao Jogo</span>
          </Link>

          <button
            type="button"
            onClick={handleCopyLink}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded bg-gold/15 border border-gold/40 text-gold hover:bg-gold/25 text-xs font-display tracking-wider cursor-pointer transition-all"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? "Link Copiado!" : "Copiar Link da Política"}</span>
          </button>
        </div>

        {/* Title */}
        <div className="text-center my-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gold/10 border border-gold/30 mb-3">
            <Shield className="w-3.5 h-3.5 text-gold" />
            <span className="font-display text-[11px] tracking-widest text-gold uppercase">
              Google Play Console & LGPD Compliance
            </span>
          </div>
          <h1 className="font-display text-3xl sm:text-5xl font-bold text-white tracking-wide drop-shadow-md">
            Política de Privacidade
          </h1>
          <p className="mt-2 text-xs sm:text-sm text-[#9e97a9]">
            Nightfall Chronicles · Identificador do Pacote: <code className="bg-[#1b1726] text-pink-200 px-1.5 py-0.5 rounded text-xs">com.nightfall.chronicles</code>
          </p>
          <p className="text-xs text-[#7e778b] mt-1">Última atualização: 2 de Novembro de 2026</p>
        </div>

        {/* Highlight Summary Card */}
        <div className="p-4 sm:p-5 rounded-lg bg-emerald-950/20 border-l-4 border-emerald-500 mb-8 text-sm text-emerald-100/90 leading-relaxed">
          <strong className="text-emerald-400 font-semibold block mb-1">Resumo de Privacidade:</strong>
          O jogo <em>Nightfall Chronicles</em> foi desenvolvido respeitando integralmente a sua privacidade.{" "}
          <strong className="text-white">Nenhum dado pessoal é coletado, transmitido, vendido ou compartilhado com terceiros.</strong> Todo o progresso do jogo (fases liberadas, recordes no modo Horda e configurações de áudio) fica gravado exclusivamente na memória local do seu próprio dispositivo.
        </div>

        {/* Content Sections */}
        <div className="space-y-6 text-sm sm:text-base leading-relaxed text-[#eae5dc]/90">
          <section>
            <h2 className="font-display text-lg sm:text-xl text-gold font-bold mb-2 flex items-center gap-2">
              <span>1. Identificação do Aplicativo e Desenvolvedor</span>
            </h2>
            <p>
              Esta Política de Privacidade aplica-se ao jogo eletrônico para dispositivos móveis e navegadores web denominado <strong>Nightfall Chronicles</strong> (doravante denominado "Aplicativo" ou "Jogo"), identificado tecnicamente pelo pacote Android <code className="bg-[#1b1726] text-pink-200 px-1 py-0.5 rounded text-xs">com.nightfall.chronicles</code>, desenvolvido por <strong>Rodpassaline</strong>.
            </p>
            <p className="mt-2">
              Nosso compromisso é garantir total transparência e conformidade com as diretrizes do <strong>Google Play Developer Distribution Agreement</strong>, a <strong>Lei Geral de Proteção de Dados (LGPD - Lei nº 13.709/2018)</strong> e a <strong>Children's Online Privacy Protection Act (COPPA)</strong>.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg sm:text-xl text-gold font-bold mb-2 flex items-center gap-2">
              <span>2. Dados Pessoais Coletados</span>
            </h2>
            <p>
              O aplicativo <strong>NÃO coleta, NÃO armazena e NÃO compartilha</strong> quaisquer dados de identificação pessoal. Isto significa que nós:
            </p>
            <ul className="list-disc list-inside space-y-1.5 mt-2 ml-2 text-[#d8d3cb]">
              <li><strong>Não solicitamos</strong> nome completo, CPF, RG ou documentos pessoais;</li>
              <li><strong>Não solicitamos</strong> e-mail, número de telefone ou perfis de redes sociais;</li>
              <li><strong>Não coletamos</strong> localização geográfica aproximada ou precisa (GPS);</li>
              <li><strong>Não acessamos</strong> sua lista de contatos, fotos, mídias ou arquivos pessoais do seu aparelho;</li>
              <li><strong>Não exigimos</strong> criação de conta, nome de usuário ou login obrigatório para jogar;</li>
              <li><strong>Não coletamos</strong> dados biométricos, informações bancárias ou cartões de crédito.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-lg sm:text-xl text-gold font-bold mb-2 flex items-center gap-2">
              <span>3. Armazenamento Local no Dispositivo (Save Game)</span>
            </h2>
            <p>
              Para que você não perca seu progresso ao fechar o jogo, o aplicativo armazena uma quantidade mínima de dados técnicos <strong>exclusivamente na memória local do seu aparelho</strong> (através de <code>localStorage</code> isolado do navegador/WebView):
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 my-4">
              <div className="p-3.5 rounded bg-[#0d0b13] border border-[#221e2d]">
                <h3 className="font-display text-xs text-gold uppercase tracking-wider mb-1">Progresso da Campanha</h3>
                <p className="text-xs text-[#9e97a9]">IDs das fases desbloqueadas e concluídas pelo jogador (1 a 7).</p>
              </div>
              <div className="p-3.5 rounded bg-[#0d0b13] border border-[#221e2d]">
                <h3 className="font-display text-xs text-gold uppercase tracking-wider mb-1">Recorde no Luar Contra Hordas</h3>
                <p className="text-xs text-[#9e97a9]">Número máximo de ondas sobrevividas para exibição do troféu pessoal.</p>
              </div>
              <div className="p-3.5 rounded bg-[#0d0b13] border border-[#221e2d]">
                <h3 className="font-display text-xs text-gold uppercase tracking-wider mb-1">Preferências de Som & Dificuldade</h3>
                <p className="text-xs text-[#9e97a9]">Estado de áudio (mudo/ativado) e dificuldade escolhida (Fácil, Médio ou Difícil).</p>
              </div>
              <div className="p-3.5 rounded bg-[#0d0b13] border border-[#221e2d]">
                <h3 className="font-display text-xs text-gold uppercase tracking-wider mb-1">Controles Touch na Tela</h3>
                <p className="text-xs text-[#9e97a9]">Preferência sobre exibir ou ocultar os botões virtuais touch.</p>
              </div>
            </div>
            <p>
              Esses dados pertencem a você, <strong>permanecem 100% confinados no seu dispositivo</strong> e nunca são sincronizados ou transmitidos para nenhum servidor externo.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg sm:text-xl text-gold font-bold mb-2 flex items-center gap-2">
              <span>4. Permissões do Aplicativo no Android</span>
            </h2>
            <p>
              O jogo foi construído para funcionar completamente offline. Não exigimos nenhuma permissão sensível no sistema Android:
            </p>
            <ul className="list-disc list-inside space-y-1 mt-2 ml-2 text-[#d8d3cb]">
              <li><strong>Sem acesso a Câmera ou Microfone</strong>;</li>
              <li><strong>Sem acesso a Contatos ou Chamadas</strong>;</li>
              <li><strong>Sem acesso a Localização</strong>;</li>
              <li><strong>Sem acesso ao Armazenamento Externo Compartilhado</strong> (opera apenas em sandbox privada do app).</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-lg sm:text-xl text-gold font-bold mb-2 flex items-center gap-2">
              <span>5. Serviços de Terceiros e Publicidade</span>
            </h2>
            <p>
              O <em>Nightfall Chronicles</em>:
            </p>
            <ul className="list-disc list-inside space-y-1 mt-2 ml-2 text-[#d8d3cb]">
              <li><strong>Não possui anúncios invasivos nem redes de publicidade comportamental</strong> que rastreiem suas atividades em outros aplicativos ou na web;</li>
              <li><strong>Não utiliza SDKs de terceiros</strong> para mineração de dados, venda de dados pessoais para data brokers ou análise comportamental;</li>
              <li><strong>Não vende, aluga ou comercializa</strong> informações de usuários sob nenhuma circunstância.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-lg sm:text-xl text-gold font-bold mb-2 flex items-center gap-2">
              <span>6. Privacidade de Crianças (COPPA e LGPD)</span>
            </h2>
            <p>
              O jogo é seguro para públicos de todas as idades. Em total observância à <strong>COPPA (Children's Online Privacy Protection Act)</strong> e aos artigos da <strong>LGPD</strong> referentes ao tratamento de dados de menores:
            </p>
            <ul className="list-disc list-inside space-y-1 mt-2 ml-2 text-[#d8d3cb]">
              <li>Não coletamos intencionalmente nenhuma informação pessoal de crianças menores de 13 anos (nem de qualquer outro usuário);</li>
              <li>O jogo não contém compras ocultas (in-app purchases) nem mecanismos predatórios de monetização.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-lg sm:text-xl text-gold font-bold mb-2 flex items-center gap-2">
              <span>7. Exclusão e Controle dos Seus Dados</span>
            </h2>
            <p>
              Você tem total soberania sobre qualquer dado armazenado pelo jogo. Para apagar completamente o histórico de fases, recordes e preferências a qualquer momento:
            </p>
            <ul className="list-disc list-inside space-y-1 mt-2 ml-2 text-[#d8d3cb]">
              <li>Acesse <strong>Configurações do Android</strong> &gt; <strong>Aplicativos</strong> &gt; <strong>Nightfall Chronicles</strong> &gt; <strong>Armazenamento</strong> &gt; <strong>Limpar Dados</strong>; ou</li>
              <li>Simplesmente <strong>desinstale o aplicativo</strong> do seu dispositivo. Todos os registros locais serão imediatamente e definitivamente excluídos.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-lg sm:text-xl text-gold font-bold mb-2 flex items-center gap-2">
              <span>8. Segurança das Informações</span>
            </h2>
            <p>
              Como o aplicativo não transmite dados pessoais pela internet nem mantém banco de dados centralizado em nuvem com perfis de usuários, o risco de vazamento ou acesso não autorizado às suas informações privadas através do <em>Nightfall Chronicles</em> é nulo.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg sm:text-xl text-gold font-bold mb-2 flex items-center gap-2">
              <span>9. Alterações nesta Política</span>
            </h2>
            <p>
              Esta Política de Privacidade poderá ser atualizada ocasionalmente para refletir melhorias no jogo ou novas exigências legais ou das lojas de aplicativos. Qualquer alteração será acompanhada pela data de atualização no topo deste documento.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg sm:text-xl text-gold font-bold mb-2 flex items-center gap-2">
              <span>10. Contato e Suporte</span>
            </h2>
            <p>
              Se você tiver qualquer dúvida, sugestão ou solicitação referente a esta Política de Privacidade ou ao jogo <em>Nightfall Chronicles</em>, sinta-se à vontade para entrar em contato:
            </p>
            <ul className="list-disc list-inside space-y-1.5 mt-2 ml-2 text-[#d8d3cb]">
              <li><strong>Desenvolvedor:</strong> Rodpassaline</li>
              <li>
                <strong>Repositório Oficial & Suporte:</strong>{" "}
                <a
                  href="https://github.com/Rodpassaline/Nightfall-Chronicles"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gold underline hover:text-white"
                >
                  https://github.com/Rodpassaline/Nightfall-Chronicles
                </a>
              </li>
              <li>
                <strong>E-mail para Dúvidas:</strong>{" "}
                <a href="mailto:rodpassaline@gmail.com" className="text-gold underline hover:text-white">
                  rodpassaline@gmail.com
                </a>
              </li>
            </ul>
          </section>
        </div>

        {/* Footer */}
        <div className="mt-10 pt-6 border-t border-[#262232] text-center text-xs text-[#8c8597]">
          <p>© 2026 Nightfall Chronicles. Todos os direitos reservados.</p>
          <p className="mt-1 text-[11px] text-[#6c6577]">
            Este documento atende às exigências de URL pública de Política de Privacidade do Google Play Developer Console.
          </p>
          <div className="mt-4">
            <Link
              to="/"
              className="inline-block bg-blood hover:bg-red-700 text-white px-6 py-2.5 rounded font-display text-xs tracking-widest uppercase transition-all shadow-md"
            >
              ← Voltar ao Jogo
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
