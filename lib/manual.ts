// Artigos adaptados a partir de uma notícia colada na página /adaptar.
// Ficam em content/manual/<id>.md, com o mesmo frontmatter das adaptações do radar.

import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { separarFrontmatter, urlHttps } from "./adaptacoes";

export const MANUAL_DIR = path.join(process.cwd(), "content", "manual");

/** id = AAAAMMDD-HHMMSS-xxxx (horário de Brasília + 4 caracteres aleatórios). */
export const ID_MANUAL = /^\d{8}-\d{6}-[a-z0-9]{4}$/;

export interface ArtigoManual {
  id: string;
  data: string;
  titulo: string;
  fonteUrl: string | null;
  fonteNome: string | null;
  plataformas: string[];
  imagem: string | null;
  imagemCredito: string | null;
  imagemOrigem: "oficial" | "veiculo" | null;
  video: string | null;
  markdown: string;
}

export function dataDoId(id: string): string {
  return `${id.slice(0, 4)}-${id.slice(4, 6)}-${id.slice(6, 8)}`;
}

export function carregarManual(id: string, baseDir: string = MANUAL_DIR): ArtigoManual | null {
  if (!ID_MANUAL.test(id)) return null;
  const arquivo = path.join(baseDir, `${id}.md`);
  if (!existsSync(arquivo)) return null;

  const { campos, corpo } = separarFrontmatter(readFileSync(arquivo, "utf8"));
  return {
    id,
    data: /^\d{4}-\d{2}-\d{2}$/.test(campos.data ?? "") ? campos.data : dataDoId(id),
    titulo: campos.titulo || id,
    fonteUrl: urlHttps(campos.fonteUrl) ?? null,
    fonteNome: campos.fonteNome || null,
    plataformas: (campos.plataformas ?? "")
      .split(",")
      .map((p) => p.trim())
      .filter(Boolean),
    imagem: urlHttps(campos.imagem),
    imagemCredito: campos.imagemCredito || null,
    imagemOrigem:
      campos.imagemOrigem === "oficial" || campos.imagemOrigem === "veiculo"
        ? campos.imagemOrigem
        : null,
    video: urlHttps(campos.video),
    markdown: corpo,
  };
}

/** Mais recentes primeiro. */
export function listarManuais(baseDir: string = MANUAL_DIR): ArtigoManual[] {
  if (!existsSync(baseDir)) return [];
  return readdirSync(baseDir)
    .filter((arquivo) => arquivo.endsWith(".md"))
    .map((arquivo) => arquivo.replace(/\.md$/, ""))
    .filter((id) => ID_MANUAL.test(id))
    .sort()
    .reverse()
    .map((id) => carregarManual(id, baseDir))
    .filter((artigo): artigo is ArtigoManual => artigo !== null);
}
