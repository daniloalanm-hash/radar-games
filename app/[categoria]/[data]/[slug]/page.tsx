import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { CATEGORIAS } from "@/config/categorias";
import { listarDatas } from "@/lib/edicoes";
import { carregarAdaptacao, listarAdaptacoes } from "@/lib/adaptacoes";
import { paraWordPress } from "@/lib/wordpress";
import { ArtigoMarkdown } from "@/components/ArtigoMarkdown";
import { BotoesWordPress } from "@/components/BotoesWordPress";
import { MidiaArtigo } from "@/components/MidiaArtigo";

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
  return {
    title: adaptacao ? `${adaptacao.titulo} — Radar Games` : "Artigo — Radar Games",
    // O mesmo texto vai para o blog da Loja dos Gifts: esta cópia não deve
    // competir com o blog no Google.
    robots: { index: false, follow: true },
  };
}

export default async function PaginaArtigo({
  params,
}: {
  params: Promise<{ categoria: string; data: string; slug: string }>;
}) {
  const { categoria, data, slug } = await params;
  const adaptacao = carregarAdaptacao(categoria, data, slug);
  if (!adaptacao) notFound();

  const wp = paraWordPress(adaptacao.markdown);

  return (
    <article className="space-y-6">
      <Link href={`/${categoria}/${data}`} className="inline-block text-sm text-suave hover:text-texto">
        ← Edição de {data}
      </Link>

      <p className="text-xs text-suave">
        Artigo adaptado para o Blog da Loja dos Gifts a partir da posição {adaptacao.posicao} do
        radar.
      </p>

      <BotoesWordPress
        titulo={wp.titulo}
        html={wp.html}
        texto={wp.texto}
        markdown={adaptacao.markdown}
      />

      <MidiaArtigo
        imagem={adaptacao.imagem}
        imagemCredito={adaptacao.imagemCredito}
        imagemOrigem={adaptacao.imagemOrigem}
        video={adaptacao.video}
      />

      <ArtigoMarkdown markdown={adaptacao.markdown} />
    </article>
  );
}
