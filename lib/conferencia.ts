// Conferência estrutural de um artigo gravado pelo redator. Não julga a
// qualidade do texto (isso é papel do redator), só garante que o arquivo
// está no formato que o site e o blog esperam antes de publicar.

import { separarFrontmatter } from "./adaptacoes";

const CAMPOS_OBRIGATORIOS = ["titulo", "data", "slug"] as const;
const CTA_TITULO = "**Quer aproveitar seus próximos jogos?**";
// Aceita o CTA atual ([**www...**](https://www.lojadosgifts.com.br/)) e o antigo, sem negrito e sem barra.
const CTA_LINK = /\[(\*\*)?www\.lojadosgifts\.com\.br(\*\*)?\]\(https:\/\/www\.lojadosgifts\.com\.br\/?\)/;

export function conferirArtigo(bruto: string): string[] {
  const problemas: string[] = [];

  if (!/^---\r?\n[\s\S]*?\r?\n---\r?\n/.test(bruto)) {
    return ["arquivo sem frontmatter (bloco entre linhas ---)"];
  }

  const { campos, corpo } = separarFrontmatter(bruto);
  for (const campo of CAMPOS_OBRIGATORIOS) {
    if (!campos[campo]) problemas.push(`frontmatter sem "${campo}"`);
  }
  if (campos.data && !/^\d{4}-\d{2}-\d{2}$/.test(campos.data)) {
    problemas.push(`data "${campos.data}" fora do formato AAAA-MM-DD`);
  }
  if (!campos.fonteUrl && !campos.fonteNome) {
    problemas.push('frontmatter sem fonte ("fonteUrl" ou "fonteNome")');
  }

  if (!corpo.startsWith("## ")) problemas.push('o corpo não começa com o título em "## "');
  if (/^# /m.test(corpo)) problemas.push('há título com "# " (use "## ")');

  const titulos = corpo.match(/^## .+$/gm) ?? [];
  if (titulos.length < 3) {
    problemas.push("faltam intertítulos (menos de 3 linhas com ##, contando o título)");
  }

  if (!corpo.includes(CTA_TITULO) || !CTA_LINK.test(corpo)) {
    problemas.push("CTA da Loja dos Gifts ausente ou alterado");
  }

  const ultimaLinha = corpo.trim().split(/\r?\n/).pop() ?? "";
  if (!ultimaLinha.startsWith("**Fonte:**")) {
    problemas.push('a última linha não é a de "**Fonte:**"');
  }

  const palavras = corpo.split(/\s+/).filter(Boolean).length;
  if (palavras < 250) problemas.push(`texto curto demais (${palavras} palavras)`);

  return problemas;
}
