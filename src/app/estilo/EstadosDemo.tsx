"use client";

import { useState } from "react";
import { Regua } from "@/components/Regua";
import { comUnidade, fmtNum } from "@/lib/format";

/**
 * EstadosDemo — a régua no limite, ao vivo (1B-05). Empurra para lá
 * de um extremo (seta no extremo, PageUp, o preset «para lá do fim»,
 * ou o dedo para lá da pista): o valor não sai e a nota explica o
 * limite junto ao polegar — discreta, sem vermelho; o mesmo texto vai
 * ao leitor de ecrã por live region. Começa no mínimo de propósito.
 */
// a grelha do cenário real (data/derived/cenarios-salario): o mínimo
// e depois de 50 em 50 até aos 6 000 € — a régua só pára nos pontos
const GRELHA = [920, ...Array.from({ length: 102 }, (_, i) => 950 + i * 50)];

export function EstadosDemo() {
  const [v, setV] = useState(920);
  return (
    <Regua
      rotulo="Salário bruto mensal"
      valor={v}
      onChange={setV}
      min={920}
      max={6000}
      passo={50}
      pontos={GRELHA}
      unidade="€"
      formato={(x) => fmtNum(x, 0)}
      marcadorAgora={{ valor: 920, rotulo: "mínimo" }}
      limites={{ min: "o salário mínimo", max: "o fim da tabela" }}
      presets={[
        { rotulo: "mínimo", valor: 920 },
        { rotulo: comUnidade(fmtNum(2000, 0), "€"), valor: 2000 },
        { rotulo: "para lá do fim", valor: 9999 },
      ]}
      descricao="no extremo, insiste — a régua não deixa sair e explica o limite junto ao polegar (e anuncia ao leitor de ecrã)"
    />
  );
}
