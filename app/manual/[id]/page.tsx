import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { carregarManual, listarManuais } from "@/lib/manual";
import { paraWordPress } from "@/lib/wordpress";
import { ArtigoMarkdown } from "@/components/ArtigoMarkdown";
import { BotoesWordPress } from "@/components/BotoesWordPress";
import { MidiaArtigo } from "@/components/MidiaArtigo";

// Só existem as páginas geradas no build: id desconhecido é 404, que é o
// que a página /adaptar usa para saber se o artigo já foi publicado.
export const dynamicParams = false;

export function generateStaticParams() {
  return listarManuais().map((artigo) => ({ id: artigo.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const artigo = carregarManual(id);
  return {
    title: artigo ? `${artigo.titulo} — Radar Games` : "Artigo — Radar Games",
    robots: { index: false, follow: false },
  };
}

export default async function PaginaManual({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const artigo = carregarManual(id);
  if (!artigo) notFound();

  const wp = paraWordPress(artigo.markdown);

  return (
    <article className="space-y-6">
      <Link href="/manual" className="inline-block text-sm text-suave hover:text-texto">
        ← Notícias adaptadas
      </Link>

      <p className="text-xs text-suave">
        Adaptado de {artigo.fonteNome ?? "notícia colada"}
        {artigo.fonteUrl && (
          <>
            {" "}
            (
            <a
              href={artigo.fonteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-texto"
            >
              original
            </a>
            )
          </>
        )}
        .
      </p>

      <BotoesWordPress titulo={wp.titulo} html={wp.html} texto={wp.texto} markdown={artigo.markdown} />

      <MidiaArtigo
        imagem={artigo.imagem}
        imagemCredito={artigo.imagemCredito}
        imagemOrigem={artigo.imagemOrigem}
        video={artigo.video}
      />

      <ArtigoMarkdown markdown={artigo.markdown} />
    </article>
  );
}
