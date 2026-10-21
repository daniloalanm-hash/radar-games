import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { carregarAdaptacao, existeAdaptacao, listarAdaptacoes } from "../lib/adaptacoes";

const ARTIGO = `---
titulo: Estúdio Exemplo anuncia aquisição bilionária
data: 2026-08-30
categoria: games
posicao: 1
slug: estudio-exemplo-anuncia-aquisicao
fonteUrl: https://www.gamesindustry.biz/exemplo
plataformas: PS5, PC
---

## Estúdio Exemplo compra publisher e sacode o mercado

### O movimento pegou a indústria de surpresa

Texto do artigo.

**Fonte:** GamesIndustry.biz
`;

const ARTIGO_COM_IMAGEM = `---
titulo: Jogo Exemplo ganha data
data: 2026-08-30
categoria: games
posicao: 2
slug: jogo-exemplo-ganha-data
fonteUrl: https://exemplo.com/n
plataformas: PC
imagem: https://cdn.steamstatic.com/apps/1/header.jpg?t=123
imagemCredito: Divulgação/Estúdio Exemplo
imagemOrigem: oficial
video: https://www.youtube.com/watch?v=AbCdEfGhIjK
---

## Jogo Exemplo ganha data
`;

let base: string;

beforeAll(() => {
  base = mkdtempSync(path.join(tmpdir(), "radar-content-"));
  mkdirSync(path.join(base, "games", "2026-08-30"), { recursive: true });
  writeFileSync(
    path.join(base, "games", "2026-08-30", "1-estudio-exemplo-anuncia-aquisicao.md"),
    ARTIGO,
  );
  writeFileSync(
    path.join(base, "games", "2026-08-30", "2-jogo-exemplo-ganha-data.md"),
    ARTIGO_COM_IMAGEM,
  );
});

describe("imagem e vídeo do artigo", () => {
  it("lê os campos novos", () => {
    const a = carregarAdaptacao("games", "2026-08-30", "jogo-exemplo-ganha-data", base)!;
    expect(a.imagem).toBe("https://cdn.steamstatic.com/apps/1/header.jpg?t=123");
    expect(a.imagemCredito).toBe("Divulgação/Estúdio Exemplo");
    expect(a.imagemOrigem).toBe("oficial");
    expect(a.video).toBe("https://www.youtube.com/watch?v=AbCdEfGhIjK");
  });

  it("artigos antigos continuam sem imagem", () => {
    const a = carregarAdaptacao("games", "2026-08-30", "estudio-exemplo-anuncia-aquisicao", base)!;
    expect([a.imagem, a.imagemCredito, a.imagemOrigem, a.video]).toEqual([null, null, null, null]);
  });
});

afterAll(() => rmSync(base, { recursive: true, force: true }));

describe("existeAdaptacao", () => {
  it("encontra a adaptação existente", () => {
    expect(existeAdaptacao("games", "2026-08-30", "estudio-exemplo-anuncia-aquisicao", base)).toBe(true);
  });

  it("devolve false para slug sem adaptação", () => {
    expect(existeAdaptacao("games", "2026-08-30", "outro-slug", base)).toBe(false);
  });

  it("devolve false para data sem pasta", () => {
    expect(existeAdaptacao("games", "2026-01-01", "qualquer", base)).toBe(false);
  });
});

describe("carregarAdaptacao", () => {
  it("lê o frontmatter e o markdown", () => {
    const adaptacao = carregarAdaptacao("games", "2026-08-30", "estudio-exemplo-anuncia-aquisicao", base)!;
    expect(adaptacao.titulo).toBe("Estúdio Exemplo anuncia aquisição bilionária");
    expect(adaptacao.posicao).toBe(1);
    expect(adaptacao.plataformas).toEqual(["PS5", "PC"]);
    expect(adaptacao.markdown).toContain("## Estúdio Exemplo compra publisher");
    expect(adaptacao.markdown).not.toContain("titulo:");
  });

  it("devolve null quando não existe", () => {
    expect(carregarAdaptacao("games", "2026-08-30", "inexistente", base)).toBeNull();
  });
});

describe("listarAdaptacoes", () => {
  it("lista as adaptações do dia", () => {
    const adaptacoes = listarAdaptacoes("games", "2026-08-30", base);
    expect(adaptacoes.map((a) => a.slug)).toEqual([
      "estudio-exemplo-anuncia-aquisicao",
      "jogo-exemplo-ganha-data",
    ]);
  });

  it("devolve lista vazia para dia sem adaptações", () => {
    expect(listarAdaptacoes("games", "2026-01-01", base)).toEqual([]);
  });
});
