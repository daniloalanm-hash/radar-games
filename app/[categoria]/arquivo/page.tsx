import { notFound } from "next/navigation";
import { CATEGORIAS, getCategoria } from "@/config/categorias";
import { carregarEdicao, listarDatas } from "@/lib/edicoes";
import { ListaArquivo, type EntradaArquivo } from "@/components/ListaArquivo";
import { NavCategorias } from "@/components/NavCategorias";

export function generateStaticParams() {
  return CATEGORIAS.map((categoria) => ({ categoria: categoria.slug }));
}

export default async function PaginaArquivo({
  params,
}: {
  params: Promise<{ categoria: string }>;
}) {
  const { categoria: slug } = await params;
  const categoria = getCategoria(slug);
  if (!categoria) notFound();

  const entradas: EntradaArquivo[] = listarDatas(slug).map((data) => {
    const edicao = carregarEdicao(slug, data);
    return {
      data,
      quantidade: edicao?.itens.length ?? 0,
      destaque: edicao?.itens[0]?.titulo ?? null,
    };
  });

  return (
    <div className="space-y-6">
      <NavCategorias ativa={slug} />
      <h1 className="text-2xl font-bold tracking-tight">Arquivo · {categoria.nome}</h1>
      <ListaArquivo categoriaSlug={slug} entradas={entradas} />
    </div>
  );
}
