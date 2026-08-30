import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { edicaoSchema } from "../lib/schema";

const fixture = JSON.parse(
  readFileSync(new URL("./fixtures/edicao-valida.json", import.meta.url), "utf8"),
);

const clone = () => JSON.parse(JSON.stringify(fixture));

describe("edicaoSchema", () => {
  it("aceita uma edição válida", () => {
    expect(edicaoSchema.safeParse(fixture).success).toBe(true);
  });

  it("rejeita item sem fonte", () => {
    const e = clone();
    delete e.itens[0].fonte;
    expect(edicaoSchema.safeParse(e).success).toBe(false);
  });

  it("rejeita slug que não é kebab-case", () => {
    const e = clone();
    e.itens[0].slug = "Slug Invalido";
    expect(edicaoSchema.safeParse(e).success).toBe(false);
  });

  it("rejeita URL de fonte inválida", () => {
    const e = clone();
    e.itens[0].fonte.url = "nao-e-url";
    expect(edicaoSchema.safeParse(e).success).toBe(false);
  });

  it("rejeita tipo fora do enum", () => {
    const e = clone();
    e.itens[0].tipo = "fofoca";
    expect(edicaoSchema.safeParse(e).success).toBe(false);
  });

  it("rejeita nota acima de 10", () => {
    const e = clone();
    e.itens[0].nota = 11;
    expect(edicaoSchema.safeParse(e).success).toBe(false);
  });

  it("rejeita data fora do formato AAAA-MM-DD", () => {
    const e = clone();
    e.data = "30/08/2026";
    expect(edicaoSchema.safeParse(e).success).toBe(false);
  });

  it("rejeita posições fora de sequência", () => {
    const e = clone();
    e.itens[1].posicao = 5;
    expect(edicaoSchema.safeParse(e).success).toBe(false);
  });

  it("rejeita mais de 10 itens", () => {
    const e = clone();
    e.itens = Array.from({ length: 11 }, (_, i) => ({
      ...fixture.itens[0],
      posicao: i + 1,
    }));
    expect(edicaoSchema.safeParse(e).success).toBe(false);
  });

  it("aceita edição vazia com observação", () => {
    const e = clone();
    e.itens = [];
    e.tambemNoRadar = [];
    e.observacao = "Nenhum destaque com fonte verificável na janela.";
    expect(edicaoSchema.safeParse(e).success).toBe(true);
  });
});
