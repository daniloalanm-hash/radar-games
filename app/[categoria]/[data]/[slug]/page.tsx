import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { CATEGORIAS } from "@/config/categorias";
import { listarDatas } from "@/lib/edicoes";
import { carregarAdaptacao, listarAdaptacoes } from "@/lib/adaptacoes";
import { ArtigoMarkdown } from "@/components/ArtigoMarkdown";
import { BotaoCopiarMarkdown } from "@/components/BotaoCopiarMarkdown";
import { FonteLink } from "@/components/FonteLink";
import type { FonteRef } from "@/lib/schema";

function fonteDaAdaptacao(fonteUrl: string): FonteRef | null {
  if (!fonteUrl) return null;
  try {
    const dominio = new URL(fonteUrl).hostname.replace(/^www\./, "");
    return { nome: dominio, url: fonteUrl, dominio };
  } catch {
    return null;
  }
}

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

  const fonte = fonteDaAdaptacao(adaptacao.fonteUrl);

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

      {adaptacao.imagem && (
        <figure className="space-y-2">
          {/* eslint-disable-next-line @next/next/no-img-element -- imagem externa, sem otimização */}
          <img
            src={adaptacao.imagem}
            alt=""
            loading="lazy"
            className="w-full rounded-lg border border-borda"
          />
          <figcaption className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-suave">
            {adaptacao.imagemCredito && <span>Imagem: {adaptacao.imagemCredito}</span>}
            {adaptacao.imagemOrigem === "veiculo" && (
              <span className="text-alerta">
                imagem do veículo, confira os direitos antes de publicar
              </span>
            )}
            <a
              href={adaptacao.imagem}
              target="_blank"
              rel="noopener noreferrer"
              className="text-destaque hover:underline"
            >
              abrir em tamanho original
            </a>
          </figcaption>
        </figure>
      )}

      {adaptacao.video && (
        <p className="text-sm">
          Trailer para inserir no blog:{" "}
          <a
            href={adaptacao.video}
            target="_blank"
            rel="noopener noreferrer"
            className="break-all text-destaque hover:underline"
          >
            {adaptacao.video}
          </a>
        </p>
      )}

      <ArtigoMarkdown markdown={adaptacao.markdown} />

      {fonte && (
        <p className="text-xs text-suave">
          Fonte: <FonteLink fonte={fonte} />
        </p>
      )}
    </article>
  );
}
