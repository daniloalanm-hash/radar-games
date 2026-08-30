import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import {
  carregarEdicao,
  listarCategoriasComDados,
  listarDatas,
  ultimaEdicao,
} from "../lib/edicoes";

const fixture = JSON.parse(
  readFileSync(new URL("./fixtures/edicao-valida.json", import.meta.url), "utf8"),
);

let base: string;

beforeAll(() => {
  base = mkdtempSync(path.join(tmpdir(), "radar-"));
  mkdirSync(path.join(base, "games"), { recursive: true });
  for (const data of ["2026-08-28", "2026-08-29", "2026-08-30"]) {
    writeFileSync(
      path.join(base, "games", `${data}.json`),
      JSON.stringify({ ...fixture, data }, null, 2),
    );
  }
  writeFileSync(path.join(base, "games", "rascunho.txt"), "ignorar");
});

afterAll(() => rmSync(base, { recursive: true, force: true }));

describe("listarDatas", () => {
  it("devolve as datas em ordem decrescente", () => {
    expect(listarDatas("games", base)).toEqual(["2026-08-30", "2026-08-29", "2026-08-28"]);
  });

  it("ignora arquivos que não são .json", () => {
    expect(listarDatas("games", base)).not.toContain("rascunho");
  });

  it("devolve lista vazia para categoria sem pasta", () => {
    expect(listarDatas("tech", base)).toEqual([]);
  });
});

describe("carregarEdicao", () => {
  it("carrega e valida uma edição existente", () => {
    const edicao = carregarEdicao("games", "2026-08-29", base);
    expect(edicao?.data).toBe("2026-08-29");
    expect(edicao?.itens).toHaveLength(2);
  });

  it("devolve null para data inexistente", () => {
    expect(carregarEdicao("games", "2026-01-01", base)).toBeNull();
  });

  it("lança erro quando o JSON não bate com o schema", () => {
    writeFileSync(path.join(base, "games", "2026-09-01.json"), JSON.stringify({ categoria: "games" }));
    expect(() => carregarEdicao("games", "2026-09-01", base)).toThrow(/2026-09-01/);
    rmSync(path.join(base, "games", "2026-09-01.json"));
  });

  it("rejeita data com formato inválido sem tocar no disco", () => {
    expect(carregarEdicao("games", "../../etc/passwd", base)).toBeNull();
  });
});

describe("ultimaEdicao", () => {
  it("devolve a edição mais recente", () => {
    expect(ultimaEdicao("games", base)?.data).toBe("2026-08-30");
  });

  it("devolve null quando não há edições", () => {
    expect(ultimaEdicao("tech", base)).toBeNull();
  });
});

describe("listarCategoriasComDados", () => {
  it("lista as pastas de categoria existentes", () => {
    expect(listarCategoriasComDados(base)).toEqual(["games"]);
  });
});
