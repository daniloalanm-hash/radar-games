import { notFound } from "next/navigation";
import { CATEGORIAS, getCategoria } from "@/config/categorias";
import { ultimaEdicao } from "@/lib/edicoes";
import { EdicaoView } from "@/components/EdicaoView";

export function generateStaticParams() {
  return CATEGORIAS.map((categoria) => ({ categoria: categoria.slug }));
}

export default async function PaginaCategoria({
  params,
}: {
  params: Promise<{ categoria: string }>;
}) {
  const { categoria: slug } = await params;
  const categoria = getCategoria(slug);
  if (!categoria) notFound();

  const edicao = ultimaEdicao(slug);
  if (!edicao) {
    return (
      <p className="text-suave">
        Ainda não há edições para {categoria.nome}. Rode <code>/radar-{slug}</code> para gerar a
        primeira.
      </p>
    );
  }

  return <EdicaoView edicao={edicao} categoria={categoria} />;
}
