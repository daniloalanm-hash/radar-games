import Link from "next/link";
import { CATEGORIAS } from "@/config/categorias";

export function NavCategorias({ ativa }: { ativa: string }) {
  return (
    <nav className="flex flex-wrap gap-2" aria-label="Categorias">
      {CATEGORIAS.map((categoria) => {
        const selecionada = categoria.slug === ativa;
        return (
          <Link
            key={categoria.slug}
            href={`/${categoria.slug}`}
            aria-current={selecionada ? "page" : undefined}
            className={
              selecionada
                ? "rounded-full border border-destaque bg-destaque/15 px-3 py-1 text-sm text-texto"
                : "rounded-full border border-borda px-3 py-1 text-sm text-suave hover:text-texto"
            }
          >
            <span aria-hidden="true">{categoria.emoji}</span> {categoria.nome}
          </Link>
        );
      })}
    </nav>
  );
}
