import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { CATEGORIAS } from "@/config/categorias";
import { listarDatas } from "@/lib/edicoes";
import { carregarAdaptacao, listarAdaptacoes } from "@/lib/adaptacoes";
import { ArtigoMarkdown } from "@/components/ArtigoMarkdown";
import { BotaoCopiarMarkdown } from "@/components/BotaoCopiarMarkdown";

export function generateStaticParams() {
  return CATEGORIAS.flatMap((categoria) =>
    listarDatas(categoria.slug).flatMap((data) =>
      listarAdaptacoes(categoria.slug, data).map((adaptacao) => ({
        categoria: categoria.slug,
        data,
        slug: adaptacao.slug,
      })),
    ),
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ categoria: string; data: string; slug: string }>;
}): Promise<Metadata> {
  const { categoria, data, slug } = await params;
  const adaptacao = carregarAdaptacao(categoria, data, slug);
  return { title: adaptacao ? `${adaptacao.titulo} — Radar Games` : "Artigo — Radar Games" };
}

export default async function PaginaArtigo({
  params,
}: {
  params: Promise<{ categoria: string; data: string; slug: string }>;
}) {
  const { categoria, data, slug } = await params;
  const adaptacao = carregarAdaptacao(categoria, data, slug);
  if (!adaptacao) notFound();

  return (
    <article className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link href={`/${categoria}/${data}`} className="text-sm text-suave hover:text-texto">
          ← Edição de {data}
        </Link>
        <BotaoCopiarMarkdown markdown={adaptacao.markdown} />
      </div>

      <p className="text-xs text-suave">
        Artigo adaptado para o Blog da Loja dos Gifts a partir da posição {adaptacao.posicao} do
        radar.
      </p>

      <ArtigoMarkdown markdown={adaptacao.markdown} />
    </article>
  );
}
