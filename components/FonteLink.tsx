import type { FonteRef } from "@/lib/schema";

export function FonteLink({ fonte }: { fonte: FonteRef }) {
  return (
    <a
      href={fonte.url}
      target="_blank"
      rel="noopener noreferrer"
      className="text-xs text-suave underline decoration-borda underline-offset-4 hover:text-texto"
      title={fonte.nome}
    >
      {fonte.dominio} ↗
    </a>
  );
}
