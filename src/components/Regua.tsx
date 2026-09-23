"use client";

import {
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { CSSProperties } from "react";
import { FINO, comUnidade } from "@/lib/format";
import { Chip } from "@/components/Chip";

/**
 * Regua — a régua física de input da Direcção V3 §5: substitui o
 * `<input type=range>` com cara de instrumento. Traços de unidade
 * (fino/forte agregados ao passo), faixa preenchida em --accent do
 * mínimo ao polegar, polegar = rectângulo cheio 14×26 com grip, valor
 * grande em mono tabular colado acima do polegar e a segui-lo,
 * marcador «agora» fixo e presets em pills.
 *
 * O controlo real é um input range transparente que cobre a pista —
 * rato, toque, teclado e AT ficam nativos (role=slider implícito,
 * setas ±passo, PageUp/PageDown, Home/End; os testes preenchem-no por
 * label). O desenho por baixo é decorativo (aria-hidden, sem
 * pointer-events) — nunca há dois sliders expostos.
 *
 * Só dentro de client components: `formato` é uma função e não
 * serializa através da fronteira servidor→cliente.
 *
 * Motion: o polegar/fill/valor transitam --dur-curta quando o valor
 * muda por preset, teclado ou clique na régua; durante o arrasto
 * (pointer premido + movimento) a classe .regua-suave sai e o polegar
 * fica 1:1 com o dedo. A cada paragem o corpo do polegar encaixa com
 * um ressalto contido (.regua-encaixa, --dur-micro + --ease-rasgo) —
 * durante o arrasto a cada snap da grelha, fora dele ao aterrar no
 * fim da transição. Reduced-motion corta-o no bloco global.
 *
 * Limites (1B-05): a régua nunca deixa sair — e quando a tentativa é
 * mesmo para lá do fim (seta no extremo, PageUp que transborda,
 * preset fora da gama, dedo para lá da pista) o limite explica-se
 * junto ao polegar: uma nota discreta em --ink2 («limite — 920 €»,
 * nunca vermelho de erro — não é erro, é a régua a fazer o dela) e
 * o mesmo texto num live region sr-only para o leitor de ecrã.
 * A nota mora no lugar do rótulo do extremo enquanto dura; sai na
 * próxima paragem interior.
 */

export interface ReguaProps {
  valor: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  passo: number;
  /** grelha de pontos exactos (ascendente) — quando presente, a régua
      só pára nestes valores: setas andam ponto a ponto, PageUp/Down
      saltam ±10 pontos, presets e cliques caem no ponto mais próximo.
      Nunca se interpola um valor fora da grelha (V4, S1-09) */
  pontos?: readonly number[];
  /** a unidade, SEM espaço — «€», «%»; a ponte ao número é o fino
      inseparável (FINO, U+202F), posto pela régua */
  unidade?: string;
  /** número → texto sem unidade (ex.: `(v) => fmtNum(v, 0)`) */
  formato: (v: number) => string;
  /** rótulo visível + nome acessível do slider (PT) */
  rotulo: string;
  /** marcador fixo na escala — traço mais alto + «{rotulo} {fmt}» mono */
  marcadorAgora?: { valor: number; rotulo: string };
  /** pills de salto — o valor pedido é ajustado à grelha do passo */
  presets?: { rotulo: string; valor: number }[];
  /** nota de rodapé (ajuda de teclado, contexto) */
  descricao?: string;
  /** a razão do limite por lado, quando a régua a sabe dizer —
      junta-se ao valor («limite — 920 € · o salário mínimo»);
      sem ela a nota fica só «limite — {valor}» */
  limites?: { min?: string; max?: string };
  id?: string;
}

const grampo = (v: number, lo: number, hi: number) =>
  Math.min(hi, Math.max(lo, v));

/** largura estimada de texto mono 10 px — serve para manter o rótulo
    «agora» afastado dos extremos sem medir o DOM */
const CH10 = 6.6;

/** Passo dos traços: fino agrega o passo até ≤ ~72 marcas; forte é o
    múltiplo de fino com mantissa «redonda» (1, 1.5, 2, 2.5, 5) mais
    próximo de ~10 divisões — a escala cai sempre em números redondos. */
function passosTracos(min: number, max: number, passo: number) {
  const alcance = max - min;
  let fino = passo;
  for (const m of [1, 2, 4, 5, 10, 20, 40, 50, 100, 200, 400, 500]) {
    fino = passo * m;
    if (alcance / fino <= 72) break;
  }
  let forte = fino * 5;
  for (const k of [5, 4, 8, 10]) {
    const cand = fino * k;
    const e = Math.pow(10, Math.floor(Math.log10(cand)));
    const mant = cand / e;
    if (
      alcance / cand >= 3 &&
      [1, 1.5, 2, 2.5, 5].some((x) => Math.abs(mant - x) < 0.01)
    ) {
      forte = cand;
      break;
    }
  }
  return { fino, forte };
}

export function Regua({
  valor,
  onChange,
  min,
  max,
  passo,
  unidade = "",
  formato,
  rotulo,
  marcadorAgora,
  presets,
  descricao,
  limites,
  pontos,
  id: idProp,
}: ReguaProps) {
  const idAuto = useId();
  const id = idProp ?? idAuto;

  const premido = useRef(false);
  /** pointermove já aconteceu com o botão premido — síncrono, ao
      contrário de `arrasto` (estado), para o primeiro snap do
      arrasto também ressoar */
  const movido = useRef(false);
  const [arrasto, setArrasto] = useState(false);
  // a transição só arma depois da primeira interacção — sem isto, a
  // medida --meia-v na hidratação podia mexer o rótulo 1 px e a
  // transição corria acima da dobra ao carregar (M-09)
  const [vivo, setVivo] = useState(false);
  // nonce do ressalto — sobe a cada paragem (snap no arrasto, aterragem
  // no fim da transição); o key do corpo do polegar rearma a keyframe
  const [encaixe, setEncaixe] = useState(0);
  // a tentativa para lá do fim: lado marcado + nonce (o leitor de
  // ecrã re-anuncia cada insistência de teclado; o dedo encostado à
  // borda anuncia uma vez — não é sirene)
  const [limite, setLimite] = useState<{
    lado: "min" | "max";
    n: number;
  } | null>(null);
  const palcoRef = useRef<HTMLDivElement>(null);
  const pistaRef = useRef<HTMLDivElement>(null);
  const valorRef = useRef<HTMLSpanElement>(null);

  const casas = (String(passo).split(".")[1] ?? "").length;
  /** índice do ponto da grelha mais próximo de v */
  const idxProximo = (v: number) => {
    let melhor = 0;
    for (let i = 1; i < (pontos?.length ?? 0); i++) {
      if (Math.abs(pontos![i] - v) < Math.abs(pontos![melhor] - v)) melhor = i;
    }
    return melhor;
  };
  /** o valor pedido cai na grelha: pontos exactos ou passo (base min) */
  const ajustar = (v: number) =>
    pontos
      ? pontos[idxProximo(v)]
      : grampo(
          Number(
            (min + Math.round((v - min) / passo) * passo).toFixed(casas + 2)
          ),
          min,
          max
        );
  const marcaLimite = (lado: "min" | "max", repetir = false) =>
    setLimite((l) =>
      l && l.lado === lado && !repetir ? l : { lado, n: (l?.n ?? 0) + 1 }
    );

  const emit = (v: number) => {
    setVivo(true);
    const alvo = ajustar(v);
    // o pedido cru passou o fim (preset fora da gama, PageUp que
    // transborda) → o limite explica-se; uma paragem interior limpa-o
    const fora = v > max + 1e-9 ? "max" : v < min - 1e-9 ? "min" : null;
    if (fora) marcaLimite(fora, true);
    else if (alvo !== valor) setLimite(null);
    // snap durante o arrasto: cada paragem da grelha encaixa com o
    // ressalto (fora do arrasto o ressalto vem do transitionend — a
    // aterragem no fim do trajecto)
    if (movido.current && alvo !== valor) setEncaixe((n) => n + 1);
    onChange(alvo);
  };

  const alcance = max - min;
  const pct = grampo(((valor - min) / alcance) * 100, 0, 100);
  const agora =
    marcadorAgora && marcadorAgora.valor >= min && marcadorAgora.valor <= max
      ? marcadorAgora
      : null;
  const pctAgora = agora ? ((agora.valor - min) / alcance) * 100 : 0;
  const textoAgora = agora
    ? `${agora.rotulo} ${comUnidade(formato(agora.valor), unidade)}`
    : "";

  const { fino, forte } = useMemo(
    () => passosTracos(min, max, passo),
    [min, max, passo]
  );
  const tracos = useMemo(() => {
    const out: { p: number; f: boolean }[] = [];
    const eps = Math.abs(fino) * 1e-4;
    const ini = Math.ceil((min - eps) / fino) * fino;
    const n = Math.min(400, Math.round((max - ini) / fino));
    for (let i = 0; i <= n; i++) {
      const v = ini + i * fino;
      out.push({
        p: ((v - min) / alcance) * 100,
        f: Math.abs(v / forte - Math.round(v / forte)) < 0.001,
      });
    }
    return out;
  }, [fino, forte, min, max, alcance]);

  // a régua fecha sempre com traço forte nos dois extremos
  const extremos = [0, 100];

  // o rótulo «agora» afasta-se dos rótulos dos extremos (larguras
  // estimadas a 10 px mono — não vale a pena medir três nós)
  const wMin = comUnidade(formato(min), unidade).length * CH10 + 4;
  const wMax = comUnidade(formato(max), unidade).length * CH10 + 4;
  const wAgora = textoAgora.length * CH10;
  const esqAgora = Math.max(wAgora / 2, wMin + wAgora / 2 + 6);
  const dirAgora = Math.max(wAgora / 2, wMax + wAgora / 2 + 6);

  // o valor grande segue o polegar mas nunca sai do palco: metade da
  // sua largura real mede-se quando o texto muda (mono tabular — mesmo
  // número de caracteres = mesma largura; durante o arrasto a maioria
  // das frames partilha o texto e não força layout)
  const ultimoTexto = useRef("");
  useLayoutEffect(() => {
    const p = palcoRef.current;
    const v = valorRef.current;
    if (!p || !v) return;
    const t = comUnidade(formato(valor), unidade);
    if (t === ultimoTexto.current) return;
    ultimoTexto.current = t;
    p.style.setProperty("--meia-v", `${v.offsetWidth / 2}px`);
  });

  const solta = () => {
    premido.current = false;
    movido.current = false;
    setArrasto(false);
  };

  // a nota do limite — «limite — {valor}» sempre com o número do
  // fim (é a informação); a razão por prop junta-se-lhe atrás:
  // «limite — 920 € · o salário mínimo»
  const notaLimite = limite
    ? `limite — ${comUnidade(formato(limite.lado === "min" ? min : max), unidade)}` +
      (limites?.[limite.lado] ? ` · ${limites[limite.lado]}` : "")
    : "";

  return (
    <div className={`regua${vivo && !arrasto ? " regua-suave" : ""}`}>
      <label className="kicker regua-rotulo" htmlFor={id}>
        {rotulo}
      </label>
      <div className="regua-palco" ref={palcoRef}>
        <div className="regua-vslot" aria-hidden="true">
          <span
            className="regua-valor"
            ref={valorRef}
            style={
              {
                left: `clamp(var(--meia-v, 2.6rem), ${pct}%, calc(100% - var(--meia-v, 2.6rem)))`,
              } as CSSProperties
            }
          >
            {formato(valor)}
            {unidade && (
              <span className="regua-un">
                {FINO}
                {unidade}
              </span>
            )}
          </span>
        </div>

        <div className="regua-pista" ref={pistaRef}>
          <div className="regua-desenho" aria-hidden="true">
            <span className="regua-linha" />
            {tracos.map((tr, i) => (
              <span
                key={i}
                className={`regua-tq${tr.f ? " regua-tq-f" : ""}`}
                style={{ left: `${tr.p}%` }}
              />
            ))}
            {extremos.map((p) => (
              <span
                key={`e${p}`}
                className="regua-tq regua-tq-f"
                style={{ left: `${p}%` }}
              />
            ))}
            {agora && (
              <span
                className="regua-tq regua-tq-a"
                style={{ left: `${pctAgora}%` }}
              />
            )}
            <span className="regua-fill" style={{ width: `${pct}%` }} />
            <span
              className="regua-polegar"
              style={{ left: `${pct}%` }}
              onTransitionEnd={(e) => {
                if (e.propertyName === "left") setEncaixe((n) => n + 1);
              }}
            >
              <span
                key={encaixe}
                className={`regua-polegar-corpo${encaixe > 0 ? " regua-encaixa" : ""}`}
              />
            </span>
          </div>
          <input
            id={id}
            type="range"
            className="regua-input"
            min={min}
            max={max}
            step={pontos ? "any" : passo}
            value={valor}
            aria-valuetext={comUnidade(formato(valor), unidade)}
            onChange={(e) => emit(Number(e.target.value))}
            // com pontos: setas andam ponto a ponto e PageUp/Down ±10
            // pontos; sem pontos: PageUp/Down saltam exactamente
            // 10×passo (o nativo do Chrome move ~10 % do alcance)
            onKeyDown={(e) => {
              if (pontos) {
                const salto =
                  e.key === "ArrowRight" || e.key === "ArrowUp"
                    ? 1
                    : e.key === "ArrowLeft" || e.key === "ArrowDown"
                      ? -1
                      : e.key === "PageUp"
                        ? 10
                        : e.key === "PageDown"
                          ? -10
                          : 0;
                if (salto !== 0) {
                  e.preventDefault();
                  const i = grampo(
                    idxProximo(valor) + salto,
                    0,
                    pontos.length - 1
                  );
                  // já se está no ponto do extremo — a insistência é
                  // tentativa de sair: o limite explica-se
                  if (pontos[i] === valor) {
                    marcaLimite(salto > 0 ? "max" : "min", true);
                  }
                  emit(pontos[i]);
                }
                return;
              }
              // sem grelha de pontos o nativo trata das setas — quando
              // já se está no extremo nada acontece (nem onChange):
              // detecta-se aqui para o limite se explicar
              if (
                (e.key === "ArrowRight" || e.key === "ArrowUp") &&
                valor >= max
              ) {
                marcaLimite("max", true);
              } else if (
                (e.key === "ArrowLeft" || e.key === "ArrowDown") &&
                valor <= min
              ) {
                marcaLimite("min", true);
              }
              if (e.key === "PageUp" || e.key === "PageDown") {
                e.preventDefault();
                emit(valor + (e.key === "PageUp" ? 10 : -10) * passo);
              }
            }}
            onPointerDown={() => {
              premido.current = true;
              setVivo(true);
            }}
            onPointerMove={(e) => {
              if (premido.current && e.buttons > 0) {
                movido.current = true;
                if (!arrasto) setArrasto(true);
                // o dedo saiu da pista para lá de um extremo — o valor
                // já está grampeado pelo nativo; a nota diz porquê
                const pista = pistaRef.current;
                if (pista) {
                  const r = pista.getBoundingClientRect();
                  if (e.clientX > r.right + 6) marcaLimite("max");
                  else if (e.clientX < r.left - 6) marcaLimite("min");
                }
              }
            }}
            onPointerUp={solta}
            onPointerCancel={solta}
            onLostPointerCapture={solta}
            onBlur={solta}
          />
        </div>

        <div className="regua-escala" aria-hidden="true">
          {/* no extremo marcado a nota do limite toma o lugar do
              rótulo — é junto ao polegar, que aí está colado ao fim */}
          {limite?.lado === "min" ? (
            <span className="regua-nota">{notaLimite}</span>
          ) : (
            <span className="regua-min">
              {comUnidade(formato(min), unidade)}
            </span>
          )}
          {agora && (
            <span
              className="regua-agora"
              style={{
                left: `clamp(${esqAgora}px, ${pctAgora}%, calc(100% - ${dirAgora}px))`,
              }}
            >
              {textoAgora}
            </span>
          )}
          {limite?.lado === "max" ? (
            <span className="regua-nota regua-nota-max">{notaLimite}</span>
          ) : (
            <span className="regua-max">
              {comUnidade(formato(max), unidade)}
            </span>
          )}
        </div>
      </div>

      {/* o mesmo limite para o leitor de ecrã — live region sr-only;
          a key rearma a região a cada insistência de teclado para a
          frase voltar a ser anunciada */}
      <span
        role="status"
        className="sr-only"
        key={limite ? `${limite.lado}-${limite.n}` : "repouso"}
      >
        {notaLimite}
      </span>

      {presets && presets.length > 0 && (
        <div className="regua-pills">
          {presets.map((p) => {
            const alvo = ajustar(p.valor);
            const ativo = Math.abs(valor - alvo) < (pontos ? 1 : passo / 2);
            return (
              <Chip
                key={p.rotulo}
                ativo={ativo}
                onClick={() => emit(p.valor)}
              >
                {p.rotulo}
              </Chip>
            );
          })}
        </div>
      )}
      {descricao && <p className="footnote regua-desc">{descricao}</p>}
    </div>
  );
}
