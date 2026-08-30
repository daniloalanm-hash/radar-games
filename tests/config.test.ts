import { describe, expect, it } from "vitest";
import { FONTES_GAMES } from "../config/fontes";
import { CATEGORIAS, CATEGORIA_PADRAO, getCategoria } from "../config/categorias";

describe("catálogo de fontes", () => {
  it("não tem URLs duplicadas", () => {
    const urls = FONTES_GAMES.map((f) => f.url);
    expect(new Set(urls).size).toBe(urls.length);
  });

  it("tem peso entre 1 e 10 em todas as fontes", () => {
    for (const fonte of FONTES_GAMES) {
      expect(fonte.peso).toBeGreaterThanOrEqual(1);
      expect(fonte.peso).toBeLessThanOrEqual(10);
    }
  });

  it("cobre os três escopos", () => {
    const escopos = new Set(FONTES_GAMES.map((f) => f.escopo));
    expect(escopos).toEqual(new Set(["nacional", "internacional", "esports"]));
  });

  it("inclui as fontes obrigatórias informadas pelo usuário", () => {
    const dominios = FONTES_GAMES.map((f) => f.url);
    for (const obrigatoria of [
      "https://www.adrenaline.com.br/games/",
      "https://www.omelete.com.br/games",
      "https://br.ign.com/",
      "https://www.dust2.com.br/",
      "https://www.eurogamer.pt/",
      "https://flowgames.gg/noticias/",
      "https://www.einerd.com/secao/games/",
      "https://www.gamespot.com/category/news/",
      "https://gameinformer.com/news",
      "https://insider-gaming.com/category/news/",
    ]) {
      expect(dominios).toContain(obrigatoria);
    }
  });
});

describe("registro de categorias", () => {
  it("tem games como categoria padrão", () => {
    expect(CATEGORIA_PADRAO).toBe("games");
    expect(getCategoria("games")).toBeDefined();
  });

  it("games declara exatamente os 5 pesquisadores", () => {
    expect(getCategoria("games")!.agentes).toEqual([
      "radar-empresas-nacionais",
      "radar-empresas-internacionais",
      "radar-lancamentos-nacionais",
      "radar-lancamentos-internacionais",
      "radar-esports",
    ]);
  });

  it("não tem slugs duplicados", () => {
    const slugs = CATEGORIAS.map((c) => c.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("devolve undefined para categoria inexistente", () => {
    expect(getCategoria("nao-existe")).toBeUndefined();
  });
});
