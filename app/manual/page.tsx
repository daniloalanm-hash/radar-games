import type { Metadata } from "next";
import Link from "next/link";
import { listarManuais } from "@/lib/manual";

export const metadata: Metadata = {
  title: "Notícias adaptadas — Radar Games",
  robots: { index: false, follow: false },
};

function formatarData(data: string) {
  const [ano, mes, dia] = data.split("-");
  return `${dia}/${mes}/${ano}`;
}

export default function PaginaManuais() {
  const artigos = listarManuais();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h1 className="text-2xl font-bold tracking-tight">Notícias adaptadas</h1>
        <Link href="/adaptar" className="text-sm text-destaque hover:underline">
          + adaptar outra notícia
        </Link>
      </div>

      {artigos.length === 0 ? (
        <p className="text-suave">Nenhuma notícia adaptada ainda.</p>
      ) : (
        <ul className="divide-y divide-borda rounded-lg border border-borda">
          {artigos.map((artigo) => (
            <li key={artigo.id}>
              <Link
                href={`/manual/${artigo.id}`}
                className="flex items-baseline justify-between gap-4 px-4 py-3 hover:bg-superficie"
              >
                <span>
                  <span className="block text-sm">{artigo.titulo}</span>
                  {artigo.fonteNome && (
                    <span className="block text-xs text-suave">Fonte: {artigo.fonteNome}</span>
                  )}
                </span>
                <span className="shrink-0 text-xs text-suave">{formatarData(artigo.data)}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
