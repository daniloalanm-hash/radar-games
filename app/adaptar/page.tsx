import type { Metadata } from "next";
import Link from "next/link";
import { FormAdaptar } from "@/components/FormAdaptar";
import { listarManuais } from "@/lib/manual";

export const metadata: Metadata = {
  title: "Adaptar notícia — Radar Games",
  robots: { index: false, follow: false },
};

function formatarData(data: string) {
  const [ano, mes, dia] = data.split("-");
  return `${dia}/${mes}/${ano}`;
}

export default function PaginaAdaptar() {
  const recentes = listarManuais().slice(0, 8);

  return (
    <div className="space-y-10">
      <header className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight">Adaptar notícia para o blog</h1>
        <p className="max-w-2xl text-sm leading-relaxed text-suave">
          Cole uma notícia de qualquer site. O redator do radar reescreve no padrão do Blog da Loja
          dos Gifts, procura imagem oficial e trailer, e devolve o artigo pronto para copiar e colar
          no WordPress. Leva cerca de 5 minutos.
        </p>
      </header>

      <FormAdaptar />

      {recentes.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-baseline justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-suave">
              Adaptadas recentemente
            </h2>
            <Link href="/manual" className="text-sm text-suave hover:text-texto">
              ver todas →
            </Link>
          </div>
          <ul className="divide-y divide-borda rounded-lg border border-borda">
            {recentes.map((artigo) => (
              <li key={artigo.id}>
                <Link
                  href={`/manual/${artigo.id}`}
                  className="flex items-baseline justify-between gap-4 px-4 py-3 hover:bg-superficie"
                >
                  <span className="text-sm">{artigo.titulo}</span>
                  <span className="shrink-0 text-xs text-suave">{formatarData(artigo.data)}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
