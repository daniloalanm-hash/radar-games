import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";

export const CONTENT_DIR = path.join(process.cwd(), "content", "adaptacoes");

export interface Adaptacao {
  categoria: string;
  data: string;
  posicao: number;
  slug: string;
  titulo: string;
  fonteUrl: string;
  plataformas: string[];
  markdown: string;
}

// Nota: parser de frontmatter feito à mão de propósito — os arquivos são
// escritos por um agente que controlamos, num formato que nós definimos
// (uma chave por linha, sem aninhamento), então uma dependência de YAML
// seria não-usada. Ver task brief.
function separarFrontmatter(bruto: string): { campos: Record<string, string>; corpo: string } {
  const match = bruto.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!match) return { campos: {}, corpo: bruto.trim() };

  const campos: Record<string, string> = {};
  for (const linha of match[1].split(/\r?\n/)) {
    const separador = linha.indexOf(":");
    if (separador === -1) continue;
    campos[linha.slice(0, separador).trim()] = linha.slice(separador + 1).trim();
  }
  return { campos, corpo: match[2].trim() };
}

function arquivosDoDia(categoria: string, data: string, baseDir: string): string[] {
  const dir = path.join(baseDir, categoria, data);
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((arquivo) => arquivo.endsWith(".md"))
    .sort();
}

function slugDoArquivo(arquivo: string): string {
  return arquivo.replace(/\.md$/, "").replace(/^\d+-/, "");
}

export function existeAdaptacao(
  categoria: string,
  data: string,
  slug: string,
  baseDir: string = CONTENT_DIR,
): boolean {
  return arquivosDoDia(categoria, data, baseDir).some(
    (arquivo) => slugDoArquivo(arquivo) === slug,
  );
}

export function carregarAdaptacao(
  categoria: string,
  data: string,
  slug: string,
  baseDir: string = CONTENT_DIR,
): Adaptacao | null {
  const arquivo = arquivosDoDia(categoria, data, baseDir).find(
    (nome) => slugDoArquivo(nome) === slug,
  );
  if (!arquivo) return null;

  const bruto = readFileSync(path.join(baseDir, categoria, data, arquivo), "utf8");
  const { campos, corpo } = separarFrontmatter(bruto);

  return {
    categoria,
    data,
    slug,
    posicao: Number(campos.posicao ?? 0),
    titulo: campos.titulo ?? slug,
    fonteUrl: campos.fonteUrl ?? "",
    plataformas: (campos.plataformas ?? "")
      .split(",")
      .map((p) => p.trim())
      .filter(Boolean),
    markdown: corpo,
  };
}

export function listarAdaptacoes(
  categoria: string,
  data: string,
  baseDir: string = CONTENT_DIR,
): Adaptacao[] {
  return arquivosDoDia(categoria, data, baseDir)
    .map((arquivo) => carregarAdaptacao(categoria, data, slugDoArquivo(arquivo), baseDir))
    .filter((adaptacao): adaptacao is Adaptacao => adaptacao !== null);
}
