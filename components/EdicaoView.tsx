import Link from "next/link";
import type { Categoria } from "@/config/categorias";
import { existeAdaptacao } from "@/lib/adaptacoes";
import type { Edicao } from "@/lib/schema";
import { CabecalhoEdicao } from "./CabecalhoEdicao";
import { NavCategorias } from "./NavCategorias";
import { RadarCard } from "./RadarCard";

export function EdicaoView({ edicao, categoria }: { edicao: Edicao; categoria: Categoria }) {
  return (
    <div className="space-y-8">
      <NavCategorias ativa={categoria.slug} />
      <CabecalhoEdicao edicao={edicao} categoriaNome={categoria.nome} />

      {edicao.itens.length === 0 ? (
        <p className="text-suave">Nenhum destaque com fonte verificável nesta janela.</p>
      ) : (
        <div className="space-y-4">
          {edicao.itens.map((item) => (
            <RadarCard
              key={item.slug}
              item={item}
              linkArtigo={
                existeAdaptacao(categoria.slug, edicao.data, item.slug)
                  ? `/${categoria.slug}/${edicao.data}/${item.slug}`
                  : undefined
              }
            />
          ))}
        </div>
      )}

      <Link
        href={`/${categoria.slug}/arquivo`}
        className="inline-block text-sm text-suave hover:text-texto"
      >
        Ver edições anteriores →
      </Link>
    </div>
  );
}
