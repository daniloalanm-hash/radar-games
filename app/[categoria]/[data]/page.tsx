import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { CATEGORIAS, getCategoria } from "@/config/categorias";
import { carregarEdicao, listarDatas } from "@/lib/edicoes";
import { EdicaoView } from "@/components/EdicaoView";

export function generateStaticParams() {
  return CATEGORIAS.flatMap((categoria) =>
    listarDatas(categoria.slug).map((data) => ({ categoria: categoria.slug, data })),
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ categoria: string; data: string }>;
}): Promise<Metadata> {
  const { categoria, data } = await params;
  return { title: `Radar ${categoria} — ${data}` };
}

export default async function PaginaEdicao({
  params,
}: {
  params: Promise<{ categoria: string; data: string }>;
}) {
  const { categoria: slug, data } = await params;
  const categoria = getCategoria(slug);
  if (!categoria) notFound();

  const edicao = carregarEdicao(slug, data);
  if (!edicao) notFound();

  return <EdicaoView edicao={edicao} categoria={categoria} />;
}
