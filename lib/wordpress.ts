// Converte o markdown do redator em HTML limpo para colar no editor do
// WordPress (Gutenberg transforma <h2>, <p>, <ul>, <strong> e <a> em blocos).
//
// Usa o mesmo subconjunto de markdown que components/ArtigoMarkdown.tsx:
// ## e ### para títulos, listas com "- ", **negrito** e [texto](url).
// O título (primeiro "## ") sai separado, porque no WordPress ele vai no
// campo de título do post, não no corpo.

export interface TextoWordPress {
  titulo: string;
  html: string;
  texto: string;
}

function escapar(texto: string): string {
  return texto
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function urlSegura(url: string): string | null {
  try {
    const u = new URL(url);
    return u.protocol === "https:" || u.protocol === "http:" ? u.toString() : null;
  } catch {
    return null;
  }
}

const TOKEN =
  /(\*\*\[[^\]]+\]\([^)]+\)\*\*|\[\*\*[^*\]]+\*\*\]\([^)]+\)|\*\*[^*]+\*\*|\[[^\]]+\]\([^)]+\))/g;

function link(rotuloHtml: string, url: string): string {
  const segura = urlSegura(url);
  return segura ? `<a href="${escapar(segura)}">${rotuloHtml}</a>` : rotuloHtml;
}

export function inlineParaHtml(texto: string): string {
  return texto
    .split(TOKEN)
    .map((pedaco) => {
      let m = pedaco.match(/^\*\*\[([^\]]+)\]\(([^)]+)\)\*\*$/);
      if (m) return `<strong>${link(escapar(m[1]), m[2])}</strong>`;
      m = pedaco.match(/^\[\*\*([^*]+)\*\*\]\(([^)]+)\)$/);
      if (m) return link(`<strong>${escapar(m[1])}</strong>`, m[2]);
      m = pedaco.match(/^\*\*([^*]+)\*\*$/);
      if (m) return `<strong>${escapar(m[1])}</strong>`;
      m = pedaco.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
      if (m) return link(escapar(m[1]), m[2]);
      return escapar(pedaco);
    })
    .join("");
}

export function inlineParaTexto(texto: string): string {
  return texto
    .replace(/\*\*\[([^\]]+)\]\(([^)]+)\)\*\*/g, "$1 ($2)")
    .replace(/\[\*\*([^*\]]+)\*\*\]\(([^)]+)\)/g, "$1 ($2)")
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, rotulo: string, url: string) =>
      rotulo === url || url.endsWith(rotulo) ? url : `${rotulo} (${url})`,
    )
    .replace(/\*\*([^*]+)\*\*/g, "$1");
}

function blocos(markdown: string): string[] {
  return markdown
    .trim()
    .split(/\r?\n\s*\r?\n/)
    .map((b) => b.trim())
    .filter(Boolean);
}

export function paraWordPress(markdown: string): TextoWordPress {
  const todos = blocos(markdown);
  let titulo = "";
  if (todos[0]?.startsWith("## ")) {
    titulo = inlineParaTexto(todos.shift()!.slice(3).trim());
  }

  const html: string[] = [];
  const texto: string[] = [];

  for (const bloco of todos) {
    const linhas = bloco.split(/\r?\n/);
    const cabecalho = bloco.match(/^(#{2,3}) (.+)$/s);
    if (cabecalho && linhas.length === 1) {
      const tag = cabecalho[1].length === 2 ? "h2" : "h3";
      html.push(`<${tag}>${inlineParaHtml(cabecalho[2].trim())}</${tag}>`);
      texto.push(inlineParaTexto(cabecalho[2].trim()));
      continue;
    }

    if (linhas.every((linha) => /^[-*] /.test(linha))) {
      const itens = linhas.map((linha) => linha.slice(2).trim());
      html.push(`<ul>${itens.map((i) => `<li>${inlineParaHtml(i)}</li>`).join("")}</ul>`);
      texto.push(itens.map((i) => `• ${inlineParaTexto(i)}`).join("\n"));
      continue;
    }

    // Linhas seguidas no mesmo bloco (como no CTA: frase e link embaixo)
    // continuam em linhas separadas no WordPress.
    html.push(`<p>${linhas.map((l) => inlineParaHtml(l.trim())).join("<br>")}</p>`);
    texto.push(linhas.map((l) => inlineParaTexto(l.trim())).join("\n"));
  }

  return { titulo, html: html.join("\n"), texto: texto.join("\n\n") };
}
