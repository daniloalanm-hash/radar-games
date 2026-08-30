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

let base: string;

beforeAll(() => {
  base = mkdtempSync(path.join(tmpdir(), "radar-content-"));
  mkdirSync(path.join(base, "games", "2026-08-30"), { recursive: true });
  writeFileSync(
    path.join(base, "games", "2026-08-30", "1-estudio-exemplo-anuncia-aquisicao.md"),
    ARTIGO,
  );
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
    expect(adaptacoes).toHaveLength(1);
    expect(adaptacoes[0].slug).toBe("estudio-exemplo-anuncia-aquisicao");
  });

  it("devolve lista vazia para dia sem adaptações", () => {
    expect(listarAdaptacoes("games", "2026-01-01", base)).toEqual([]);
  });
});
