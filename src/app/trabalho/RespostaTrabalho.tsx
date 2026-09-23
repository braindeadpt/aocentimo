"use client";

import { Cartao } from "@/components/Cartao";
import { NumHero } from "@/components/NumHero";
import { Regua } from "@/components/Regua";
import { fmtEUR, fmtNum } from "@/lib/format";
import { useTrabalho } from "./contexto";

/**
 * Nível 1 de /trabalho (3A-03): UM instrumento — o cartão com a régua
 * do salário (a mesma grelha canónica de /salario) e a resposta: a
 * mensalidade como número herói e a duração por baixo. Os restantes
 * dados do caso (idade, descontos, majoração) moram no nível 2.
 * No SSR sai o cenário canónico — sem JS a resposta está lá.
 */
export function RespostaTrabalho() {
  const s = useTrabalho();
  return (
    <Cartao
      icone="trabalho"
      breadcrumb="O QUE GANHAS / TRABALHO · SUBSÍDIO DE DESEMPREGO"
      controlos={
        <Regua
          id="bruto-d"
          rotulo={s.regua.rotulo}
          valor={s.bruto}
          onChange={s.setBruto}
          min={s.regua.min}
          max={s.regua.max}
          passo={s.regua.passo}
          pontos={s.regua.pontos}
          unidade="€"
          formato={(v) => fmtNum(v, 0)}
          marcadorAgora={s.regua.marcador ?? undefined}
          descricao={s.regua.descricao}
        />
      }
      fonte={{
        rotulo: "Fonte",
        itens: [{ nome: "DL 220/2006 — subsídio de desemprego" }],
      }}
    >
      {s.r.elegivel ? (
        <>
          <p className="leitura-insight">O que a Segurança Social te devolve</p>
          <NumHero
            valor={fmtEUR(s.r.mensal)}
            sufixo="/mês"
            animar={s.r.mensal}
            casas={2}
          />
          <p className="leitura-breadcrumb mt-1">
            durante {s.r.duracaoDias} dias (~{s.meses} meses)
            {s.temCorte &&
              ` — a partir do 7.º mês desce para ${fmtEUR(s.r.apos180Dias)}`}
          </p>
        </>
      ) : (
        <>
          <p className="leitura-insight">Neste caso não há subsídio</p>
          <p className="mt-1 text-corpo text-ink2">{s.r.nota}</p>
        </>
      )}
    </Cartao>
  );
}

/** a frase da resposta — valor e duração numa linha, sem jargão;
    inline (vive dentro de .pg-frase, que é um <p>) */
export function FraseTrabalho() {
  const s = useTrabalho();
  if (!s.r.elegivel) {
    return <>Com estes descontos não há subsídio — vê o porquê em «2 · Explora».</>;
  }
  return (
    <>
      Recebes <strong className="num">{fmtEUR(s.r.mensal)}</strong> por mês
      durante cerca de <strong className="num">{s.meses} meses</strong>
      {s.temCorte && <> — a partir do 7.º mês, desce 10&nbsp;%</>}.
    </>
  );
}
