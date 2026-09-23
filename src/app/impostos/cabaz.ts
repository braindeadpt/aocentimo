/**
 * O cabaz de exemplo do talão de supermercado (3B-01) — partilhado
 * entre o <TalaoCompras> (cliente: preços editáveis) e a página
 * (servidor: os cêntimos de IVA do nível 1). Não é média nacional —
 * é um cabaz de exemplo com as taxas do continente, e diz-se sempre
 * assim (regra V4: nenhum valor ilustrativo passa por dado oficial).
 *
 * Módulo puro — sem "use client": importável dos dois lados.
 */
export interface ItemCabaz {
  nome: string;
  preco: number;
  /** taxa de IVA — os valores legais do continente (6 %, 13 %, 23 %) */
  taxa: number;
}

export const CABAZ: ItemCabaz[] = [
  { nome: "PÃO DE TRIGO 400G", preco: 0.69, taxa: 0.06 },
  { nome: "LEITE UHT M.G. 1L", preco: 0.94, taxa: 0.06 },
  { nome: "MAÇÃS GALA KG", preco: 2.15, taxa: 0.06 },
  { nome: "ÁGUA MINERAL 1,5L", preco: 0.55, taxa: 0.06 },
  { nome: "ARROZ AGULHA KG", preco: 1.59, taxa: 0.06 },
  { nome: "ATUM CONSERVA ×3", preco: 4.49, taxa: 0.13 },
  { nome: "VINHO TINTO 75CL", preco: 3.99, taxa: 0.13 },
  { nome: "PILHAS AA ×4", preco: 4.99, taxa: 0.23 },
  { nome: "CHAMPÔ 400ML", preco: 3.29, taxa: 0.23 },
  { nome: "T-SHIRT ALGODÃO", preco: 9.99, taxa: 0.23 },
];
