/** Substituição simples de placeholders {chave}.
 *  Módulo próprio: importar `t` de "./messages" arrastava o
 *  messages/pt.json inteiro para os chunks do cliente. */
export function t(
  template: string,
  vars: Record<string, string | number>
): string {
  return template.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? `{${k}}`));
}
