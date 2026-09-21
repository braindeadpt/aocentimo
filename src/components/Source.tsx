import { m } from "@/lib/messages";
import { SourceBase, type SourceBaseProps } from "@/components/SourceBase";

type SourceProps = Omit<SourceBaseProps, "rotuloFonte">;

/**
 * Selo de evidência — aparece sob cada número do site.
 * O quadrado torrado é o único uso decorativo permitido ao amarelo:
 * marca sempre «isto tem fonte» (regra §3 do plano).
 *
 * Server component — resolve o rótulo «Fonte» das messages.
 * Dentro de client components usa `<SourceBase rotuloFonte=…>`.
 */
export function Source(props: SourceProps) {
  return <SourceBase {...props} rotuloFonte={m.common.fonte} />;
}
