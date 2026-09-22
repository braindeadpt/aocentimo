"use client";

import {
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { CSSProperties } from "react";

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
 * fica 1:1 com o dedo. Reduced-motion corta tudo no bloco global.
 */

export interface ReguaProps {
  valor: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  passo: number;
  /** sufixo da unidade — « €», « %» (com o espaço) */
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
  id: idProp,
}: ReguaProps) {
  const idAuto = useId();
  const id = idProp ?? idAuto;

  const premido = useRef(false);
  const [arrasto, setArrasto] = useState(false);
  // a transição só arma depois da primeira interacção — sem isto, a
  // medida --meia-v na hidratação podia mexer o rótulo 1 px e a
  // transição corria acima da dobra ao carregar (M-09)
  const [vivo, setVivo] = useState(false);
  const palcoRef = useRef<HTMLDivElement>(null);
  const valorRef = useRef<HTMLSpanElement>(null);

  const casas = (String(passo).split(".")[1] ?? "").length;
  /** o valor pedido cai na grelha do passo (base min), como o nativo */
  const ajustar = (v: number) =>
    grampo(
      Number((min + Math.round((v - min) / passo) * passo).toFixed(casas + 2)),
      min,
      max
    );
  const emit = (v: number) => {
    setVivo(true);
    onChange(ajustar(v));
  };

  const alcance = max - min;
  const pct = grampo(((valor - min) / alcance) * 100, 0, 100);
  const agora =
    marcadorAgora && marcadorAgora.valor >= min && marcadorAgora.valor <= max
      ? marcadorAgora
      : null;
  const pctAgora = agora ? ((agora.valor - min) / alcance) * 100 : 0;
  const textoAgora = agora
    ? `${agora.rotulo} ${formato(agora.valor)}${unidade}`
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
  const wMin = `${formato(min)}${unidade}`.length * CH10 + 4;
  const wMax = `${formato(max)}${unidade}`.length * CH10 + 4;
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
    const t = `${formato(valor)}${unidade}`;
    if (t === ultimoTexto.current) return;
    ultimoTexto.current = t;
    p.style.setProperty("--meia-v", `${v.offsetWidth / 2}px`);
  });

  const solta = () => {
    premido.current = false;
    setArrasto(false);
  };

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
            {unidade && <span className="regua-un">{unidade}</span>}
          </span>
        </div>

        <div className="regua-pista">
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
            />
          </div>
          <input
            id={id}
            type="range"
            className="regua-input"
            min={min}
            max={max}
            step={passo}
            value={valor}
            aria-valuetext={`${formato(valor)}${unidade}`}
            onChange={(e) => emit(Number(e.target.value))}
            // contrato V3 §5: PageUp/Down saltam exactamente 10×passo —
            // o nativo do Chrome move ~10 % do alcance
            onKeyDown={(e) => {
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
              if (premido.current && e.buttons > 0 && !arrasto)
                setArrasto(true);
            }}
            onPointerUp={solta}
            onPointerCancel={solta}
            onLostPointerCapture={solta}
            onBlur={solta}
          />
        </div>

        <div className="regua-escala" aria-hidden="true">
          <span className="regua-min">
            {formato(min)}
            {unidade}
          </span>
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
          <span className="regua-max">
            {formato(max)}
            {unidade}
          </span>
        </div>
      </div>

      {presets && presets.length > 0 && (
        <div className="regua-pills">
          {presets.map((p) => {
            const alvo = ajustar(p.valor);
            const ativo = Math.abs(valor - alvo) < passo / 2;
            return (
              <button
                key={p.rotulo}
                type="button"
                className="regua-pill"
                aria-pressed={ativo}
                onClick={() => emit(p.valor)}
              >
                {p.rotulo}
              </button>
            );
          })}
        </div>
      )}
      {descricao && <p className="footnote regua-desc">{descricao}</p>}
    </div>
  );
}
