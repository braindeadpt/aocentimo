import { m } from "@/lib/messages";
import { SourceBase, type SourceBaseProps } from "./SourceBase";

export type SourceProps = Omit<SourceBaseProps, "rotuloFonte">;

/**
 * Selo de evidência — aparece sob cada número do site (Server Component).
 * O quadrado torrado é o único uso decorativo permitido ao amarelo:
 * marca sempre «isto tem fonte» (regra §3 do plano).
 */
export function Source(props: SourceProps) {
  return <SourceBase {...props} rotuloFonte={m.common.fonte} />;
}

export { SourceBase };
