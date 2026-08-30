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
    expect(html).toContain(">1<");
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
});
