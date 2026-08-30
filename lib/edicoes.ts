import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { edicaoSchema, type Edicao } from "./schema";

export const DATA_DIR = path.join(process.cwd(), "data");

const DATA_ISO = /^\d{4}-\d{2}-\d{2}$/;

export function listarCategoriasComDados(baseDir: string = DATA_DIR): string[] {
  if (!existsSync(baseDir)) return [];
  return readdirSync(baseDir, { withFileTypes: true })
    .filter((entrada) => entrada.isDirectory())
    .map((entrada) => entrada.name)
    .sort();
}

export function listarDatas(categoria: string, baseDir: string = DATA_DIR): string[] {
  const dir = path.join(baseDir, categoria);
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((arquivo) => arquivo.endsWith(".json"))
    .map((arquivo) => arquivo.replace(/\.json$/, ""))
    .filter((data) => DATA_ISO.test(data))
    .sort()
    .reverse();
}

export function carregarEdicao(
  categoria: string,
  data: string,
  baseDir: string = DATA_DIR,
): Edicao | null {
  if (!DATA_ISO.test(data)) return null;
  const arquivo = path.join(baseDir, categoria, `${data}.json`);
  if (!existsSync(arquivo)) return null;

  const resultado = edicaoSchema.safeParse(JSON.parse(readFileSync(arquivo, "utf8")));
  if (!resultado.success) {
    const detalhes = resultado.error.issues
      .map((problema) => `${problema.path.join(".")}: ${problema.message}`)
      .join("; ");
    throw new Error(`Edição inválida em ${categoria}/${data}.json — ${detalhes}`);
  }
  return resultado.data;
}

export function ultimaEdicao(categoria: string, baseDir: string = DATA_DIR): Edicao | null {
  const [maisRecente] = listarDatas(categoria, baseDir);
  return maisRecente ? carregarEdicao(categoria, maisRecente, baseDir) : null;
}
