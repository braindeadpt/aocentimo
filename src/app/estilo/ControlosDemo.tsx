"use client";

import { useState } from "react";
import { Botao } from "@/components/Botao";
import { BotaoCopiar } from "@/components/BotaoCopiar";
import { Chip } from "@/components/Chip";
import { Interruptor } from "@/components/Interruptor";
import { Regua } from "@/components/Regua";
import { Segmentado } from "@/components/Segmentado";
import { FINO, MENOS, comUnidade, fmtNum, fmtPeriodo } from "@/lib/format";

/**
 * Demonstrações vivas do sistema de controlos (1B-03) em /estilo:
 * interruptor, chips, segmentado, régua, «a carregar» e «Copiado» —
 * tudo ligado a dados reais (a cauda de 24 meses da Euribor 12M do
 * BPstat chega por props do servidor).
 */

interface ControlosDemoProps {
  /** cauda real da Euribor 12M — a janela temporal do segmentado */
  eur: { t: string; v: number }[];
  /** último valor oficial — o marcador «agora» da régua demo */
  agora: number | null;
  /** a ajuda de teclado da régua (m.regua.dica, passada do servidor) */
  dicaRegua: string;
}

const JANELAS = [
  { id: "1a", rotulo: "1A", meses: 12 },
  { id: "2a", rotulo: "2A", meses: 24 },
  {
    id: "5a",
    rotulo: "5A",
    meses: 60,
    desativado: true,
    razao: "a série BPstat carregada tem só 24 meses",
  },
  { id: "max", rotulo: "Máx", meses: Infinity },
] as const;

export function ControlosDemo({ eur, agora, dicaRegua }: ControlosDemoProps) {
  const [ligado, setLigado] = useState(true);
  const [chip, setChip] = useState("e12");
  const [janela, setJanela] = useState("1a");
  const [taxa, setTaxa] = useState(agora ?? 2);
  const [aCarregar, setACarregar] = useState(false);

  const meses = JANELAS.find((j) => j.id === janela)?.meses ?? 12;
  const recorte = eur.slice(-meses);
  const primeiro = recorte[0];
  const ultimo = recorte[recorte.length - 1];

  const calcula = () => {
    if (aCarregar) return;
    setACarregar(true);
    setTimeout(() => setACarregar(false), 1600);
  };

  return (
    <div className="grid gap-3 md:grid-cols-2">
      {/* interruptor + chips — o acto e a escolha rápida */}
      <div className="border border-line bg-panel p-6">
        <p className="kicker-xs mb-4">Interruptor — a pílula com nó</p>
        <div className="flex flex-col gap-4">
          <Interruptor
            ligado={ligado}
            onChange={setLigado}
            rotulo="Simular choque na taxa"
            nota={ligado ? "ligado" : "desligado"}
            className="text-corpo-sm"
          />
          <Interruptor
            ligado={false}
            onChange={() => {}}
            desativado
            razao="só disponível com dados da Euribor em dia"
            rotulo="Comparar com a Euribor 6M"
            className="text-corpo-sm"
          />
        </div>
        <p className="footnote mt-4">
          <code className="num">role=&quot;switch&quot;</code> +{" "}
          <code className="num">aria-checked</code>; o estado lê-se na
          posição do nó e no trilho cheio — nunca só na cor. Desactivado
          fica focável e anuncia a razão.
        </p>

        <p className="kicker-xs mb-4 mt-8">Chips — o preset com marca</p>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Prazo da Euribor">
          {[
            ["e1", "1M"],
            ["e3", "3M"],
            ["e6", "6M"],
            ["e12", "12M"],
          ].map(([id, r]) => (
            <Chip key={id} ativo={chip === id} onClick={() => setChip(id)}>
              {r}
            </Chip>
          ))}
          <Chip desativado razao="o BPstat não publica a Euribor 1 semana nesta série">
            1S
          </Chip>
        </div>
        <p className="footnote mt-4">
          Seleccionado em três canais: <code className="num">aria-pressed</code>,
          a pílula cheia de tinta e o quadrado-marca — nunca só cor.
          São os mesmos <code className="num">&lt;Chip&gt;</code> dos
          presets da <code className="num">Regua</code>.
        </p>
      </div>

      {/* a carregar + copiado — os estados de resposta */}
      <div className="border border-line bg-panel p-6">
        <p className="kicker-xs mb-4">A carregar — o orbe no lugar do ícone</p>
        <div className="flex flex-wrap items-center gap-3">
          <Botao
            variante="primario"
            icone="repor"
            aCarregar={aCarregar ? "A calcular…" : undefined}
            onClick={calcula}
          >
            Recalcular
          </Botao>
          <Botao variante="secundario" aCarregar="A recolher…">
            Recolher
          </Botao>
        </div>
        <p className="footnote mt-4">
          O rótulo diz o que está a acontecer e o mini-orbe de pontos
          (a família <code className="num">OrbeEstado</code>) roda no
          lugar do ícone; <code className="num">aria-busy</code> +
          inércia cortam a repetição do gesto. Carrega no primeiro —
          é uma simulação viva.
        </p>

        <p className="kicker-xs mb-4 mt-8">«Copiado» — confirmação junto ao botão</p>
        <div className="flex flex-wrap items-center gap-4">
          <BotaoCopiar
            texto="/estilo"
            variante="ligacao"
            rotulo="copiar ligação"
            ariaLabel="Copiar ligação da página"
          />
          <BotaoCopiar
            texto="/estilo"
            variante="icone"
            icone="copiar-ligacao"
            ariaLabel="Copiar ligação"
          />
        </div>
        <p className="footnote mt-4">
          A nota aparece junto ao botão, anunciada por{" "}
          <code className="num">role=&quot;status&quot;</code>; se a
          clipboard falhar diz «Não copiado» — nunca finge. A acção{" "}
          <code className="num">copiar</code> do <code className="num">Cartao</code>{" "}
          usa a variante «ligacao» (cara de lq-link).
        </p>
      </div>

      {/* segmentado — a janela temporal partilhada */}
      <div className="border border-line bg-panel p-6">
        <p className="kicker-xs mb-4">Segmentado — a janela temporal</p>
        <Segmentado
          rotulo="Janela temporal"
          valor={janela}
          onChange={setJanela}
          opcoes={JANELAS.map((j) => ({
            id: j.id,
            rotulo: j.rotulo,
            desativado: "desativado" in j ? j.desativado : undefined,
            razao: "razao" in j ? j.razao : undefined,
          }))}
        />
        <p className="num mt-4 text-corpo-sm text-ink">
          {recorte.length} pontos · {fmtPeriodo(primeiro.t)} —{" "}
          {fmtPeriodo(ultimo.t)} · último {comUnidade(fmtNum(ultimo.v, 2), "%")}
        </p>
        <p className="footnote mt-3">
          Ligado à cauda real da Euribor 12M — a opção «5A» entra
          desactivada com a razão honesta, não inventada.{" "}
          <code className="num">radiogroup</code>: um ponto de
          tabulação, setas movem foco e selecção, Home/End vão aos
          extremos. É o controlo que os gráficos com janela temporal
          partilham.
        </p>
      </div>

      {/* régua — o snap e o ressalto */}
      <div className="border border-line bg-panel p-6">
        <p className="kicker-xs mb-4">A régua — encaixa nos traços</p>
        <Regua
          rotulo="Taxa a simular"
          valor={taxa}
          onChange={setTaxa}
          min={-0.5}
          max={7}
          passo={0.01}
          unidade="%"
          formato={(v) => fmtNum(v, 2)}
          marcadorAgora={
            agora !== null ? { valor: agora, rotulo: "agora" } : undefined
          }
          presets={
            agora !== null
              ? [
                  { rotulo: "agora", valor: agora },
                  {
                    rotulo: `${MENOS}0,5${FINO}p.p.`,
                    valor: agora - 0.5,
                  },
                  { rotulo: `+0,5${FINO}p.p.`, valor: agora + 0.5 },
                ]
              : undefined
          }
          descricao={dicaRegua}
        />
        <p className="footnote mt-4">
          O polegar só pára na grelha do passo — cada paragem encaixa
          com um ressalto contido (
          <code className="num">--dur-micro</code> +{" "}
          <code className="num">--ease-rasgo</code>): a cada snap do
          arrasto e ao aterrar no fim da transição. O valor acompanha
          em algarismos tabulares; o teclado é o nativo (setas ±passo,
          PageUp/Down ±10×, Home/End nos extremos).
        </p>
      </div>
    </div>
  );
}
