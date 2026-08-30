import Link from "next/link";

export interface EntradaArquivo {
  data: string;
  quantidade: number;
  destaque: string | null;
}

export function ListaArquivo({
  categoriaSlug,
  entradas,
}: {
  categoriaSlug: string;
  entradas: EntradaArquivo[];
}) {
  if (entradas.length === 0) {
    return <p className="text-suave">Nenhuma edição publicada ainda.</p>;
  }

  return (
    <ul className="divide-y divide-borda rounded-lg border border-borda">
      {entradas.map((entrada) => (
        <li key={entrada.data}>
          <Link
            href={`/${categoriaSlug}/${entrada.data}`}
            className="flex flex-col gap-1 px-4 py-3 hover:bg-superficie sm:flex-row sm:items-baseline sm:gap-4"
          >
            <span className="shrink-0 font-mono text-sm text-destaque">{entrada.data}</span>
            <span className="min-w-0 flex-1 truncate text-sm">
              {entrada.destaque ?? "Edição sem destaques"}
            </span>
            <span className="shrink-0 text-xs text-suave">{entrada.quantidade} itens</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
