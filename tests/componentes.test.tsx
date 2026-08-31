import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { readFileSync } from "node:fs";
import { SeloTipo } from "../components/SeloTipo";
import { SeloEscopo } from "../components/SeloEscopo";
import { FonteLink } from "../components/FonteLink";
import { RadarCard } from "../components/RadarCard";
import type { ItemRankeado } from "../lib/schema";

const fixture = JSON.parse(
  readFileSync(new URL("./fixtures/edicao-valida.json", import.meta.url), "utf8"),
);
const item: ItemRankeado = fixture.itens[0];

describe("SeloTipo", () => {
  it("rotula notícia confirmada", () => {
    const html = renderToStaticMarkup(<SeloTipo tipo="noticia" confiabilidade="confirmado" />);
    expect(html).toContain("Notícia");
  });

  it("destaca rumor não confirmado", () => {
    const html = renderToStaticMarkup(<SeloTipo tipo="rumor" confiabilidade="rumor" />);
    expect(html).toContain("Rumor");
    expect(html).toContain("não confirmado");
  });

  it("rotula vazamento", () => {
    const html = renderToStaticMarkup(<SeloTipo tipo="vazamento" confiabilidade="rumor" />);
    expect(html).toContain("Vazamento");
  });
});

describe("SeloEscopo", () => {
  it("marca conteúdo nacional", () => {
    expect(renderToStaticMarkup(<SeloEscopo escopo="nacional" />)).toContain("Brasil");
  });

  it("marca conteúdo internacional", () => {
    expect(renderToStaticMarkup(<SeloEscopo escopo="internacional" />)).toContain("Global");
  });
});

describe("FonteLink", () => {
  it("mostra o domínio e não a URL crua", () => {
    const html = renderToStaticMarkup(<FonteLink fonte={item.fonte} />);
    expect(html).toContain("gamesindustry.biz");
    expect(html).toContain('href="https://www.gamesindustry.biz/exemplo"');
    expect(html).not.toContain(">https://");
  });

  it("abre em nova aba com rel seguro", () => {
    const html = renderToStaticMarkup(<FonteLink fonte={item.fonte} />);
    expect(html).toContain('target="_blank"');
    expect(html).toContain("noopener");
  });
});

describe("RadarCard", () => {
  it("mostra posição, título, resumo e fonte", () => {
    const html = renderToStaticMarkup(<RadarCard item={item} />);
    expect(html).toContain("Estúdio Exemplo anuncia aquisição bilionária");
    expect(html).toContain("O estúdio confirmou a compra");
    expect(html).toContain("gamesindustry.biz");
    const rank = html.match(/text-destaque">(\d+)</)?.[1];
    expect(rank).toBe("1");
  });

  it("renderiza a posição de cada item dinamicamente, não um valor fixo", () => {
    const item2: ItemRankeado = fixture.itens[1];
    const html1 = renderToStaticMarkup(<RadarCard item={item} />);
    const html2 = renderToStaticMarkup(<RadarCard item={item2} />);
    const rank1 = html1.match(/text-destaque">(\d+)</)?.[1];
    const rank2 = html2.match(/text-destaque">(\d+)</)?.[1];
    expect(rank1).toBe("1");
    expect(rank2).toBe("2");
    expect(rank2).not.toBe(rank1);
  });

  it("lista as plataformas do item", () => {
    const html = renderToStaticMarkup(<RadarCard item={item} />);
    expect(html).toContain("PS5");
    expect(html).toContain("PC");
  });

  it("não mostra link de artigo quando não há adaptação", () => {
    expect(renderToStaticMarkup(<RadarCard item={item} />)).not.toContain("artigo adaptado");
  });

  it("mostra link de artigo quando há adaptação", () => {
    const html = renderToStaticMarkup(
      <RadarCard item={item} linkArtigo="/games/2026-08-30/estudio-exemplo-anuncia-aquisicao" />,
    );
    expect(html).toContain("artigo adaptado");
    expect(html).toContain("/games/2026-08-30/estudio-exemplo-anuncia-aquisicao");
  });

  it("mostra as tags do item prefixadas com #", () => {
    const html = renderToStaticMarkup(<RadarCard item={item} />);
    expect(html).toContain("#publisher");
    expect(html).toContain("#aquisicao");
  });

  it("não renderiza marcação extra quando o item não tem tags", () => {
    const semTags: ItemRankeado = { ...item, tags: [] };
    const html = renderToStaticMarkup(<RadarCard item={semTags} />);
    expect(html).not.toContain("#publisher");
    expect(html).not.toContain("#aquisicao");
  });
});
