import type { ItemRankeado } from "@/lib/schema";
import { SeloTipo } from "./SeloTipo";
import { SeloEscopo } from "./SeloEscopo";
import { FonteLink } from "./FonteLink";

const PLATAFORMAS_VAZIAS = new Set(["n/a", "na", "-", "—", "nenhuma", "não se aplica"]);

function plataformaValida(plataforma: string): boolean {
  const normalizada = plataforma.trim().toLowerCase();
  return normalizada.length > 0 && !PLATAFORMAS_VAZIAS.has(normalizada);
}

export function RadarCard({ item, linkArtigo }: { item: ItemRankeado; linkArtigo?: string }) {
  return (
    <article className="rounded-lg border border-borda bg-superficie p-5">
      <div className="flex gap-4">
        <span className="shrink-0 text-2xl font-bold tabular-nums text-destaque">
          {item.posicao}
        </span>
        <div className="min-w-0 flex-1">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <SeloTipo tipo={item.tipo} confiabilidade={item.confiabilidade} />
            <SeloEscopo escopo={item.escopo} />
            {item.plataformas.filter(plataformaValida).map((plataforma) => (
              <span key={plataforma} className="text-xs text-suave">
                {plataforma}
              </span>
            ))}
          </div>

          <h2 className="text-lg font-semibold leading-snug">{item.titulo}</h2>
          <p className="mt-2 text-sm leading-relaxed text-suave">{item.resumo}</p>

          <div className="mt-4 flex flex-wrap items-center gap-4 border-t border-borda pt-3">
            <FonteLink fonte={item.fonte} />
            {item.fontesSecundarias.map((fonte) => (
              <FonteLink key={fonte.url} fonte={fonte} />
            ))}
            {linkArtigo ? (
              <a href={linkArtigo} className="text-xs text-destaque hover:underline">
                artigo adaptado →
              </a>
            ) : null}
          </div>

          {item.tags.length > 0 ? (
            <div className="mt-2 flex flex-wrap gap-x-2 gap-y-1">
              {item.tags.map((tag) => (
                <span key={tag} className="text-xs text-suave/70">
                  #{tag}
                </span>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </article>
  );
}
