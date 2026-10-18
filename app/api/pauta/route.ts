import { NextResponse } from "next/server";
import { carregarAdaptacao } from "@/lib/adaptacoes";
import { carregarEdicao, listarDatas } from "@/lib/edicoes";

// Pauta pública para outras ferramentas (ex.: Bruto / Modo Narrado): as 2 edições mais recentes de games,
// só com o que já aparece no site. Estática: é regerada a cada deploy (cada edição nova é um commit).
export const dynamic = "force-static";

export function GET() {
  const edicoes = listarDatas("games")
    .slice(0, 2)
    .map((data) => carregarEdicao("games", data))
    .filter((e): e is NonNullable<typeof e> => e !== null)
    .map((e) => ({
      data: e.data,
      janela: e.janela,
      itens: e.itens.map((i) => ({
        posicao: i.posicao,
        slug: i.slug,
        titulo: i.titulo,
        resumo: i.resumo,
        tipo: i.tipo,
        escopo: i.escopo,
        confiabilidade: i.confiabilidade,
        plataformas: i.plataformas,
        tags: i.tags,
        nota: i.nota,
        dataFato: i.dataFato,
        fonte: i.fonte,
        // matéria completa já adaptada para o blog (quando existe): dá material para um roteiro de 1 min+
        artigo: carregarAdaptacao("games", e.data, i.slug)?.markdown ?? null,
      })),
    }));
  return NextResponse.json(
    { atualizado: edicoes[0]?.data ?? null, edicoes },
    { headers: { "Access-Control-Allow-Origin": "*", "Cache-Control": "public, max-age=600" } },
  );
}
