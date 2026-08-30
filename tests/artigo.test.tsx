import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { ArtigoMarkdown } from "../components/ArtigoMarkdown";

const MD = `## Título do artigo

### Subtítulo de contexto

Primeiro parágrafo com **negrito** no meio.

### Outra seção

- item um
- item dois

**Fonte:** GamesIndustry.biz
`;

describe("ArtigoMarkdown", () => {
  it("renderiza o título como h1 da página", () => {
    const html = renderToStaticMarkup(<ArtigoMarkdown markdown={MD} />);
    expect(html).toMatch(/<h1[^>]*>[\s\S]*?Título do artigo[\s\S]*?<\/h1>/);
  });

  it("renderiza as seções como h2", () => {
    const html = renderToStaticMarkup(<ArtigoMarkdown markdown={MD} />);
    expect(html).toMatch(/<h2[^>]*>[\s\S]*?Subtítulo de contexto[\s\S]*?<\/h2>/);
  });

  it("converte negrito em <strong>", () => {
    expect(renderToStaticMarkup(<ArtigoMarkdown markdown={MD} />)).toContain(
      "<strong>negrito</strong>",
    );
  });

  it("renderiza listas", () => {
    const html = renderToStaticMarkup(<ArtigoMarkdown markdown={MD} />);
    expect(html).toContain("<ul");
    expect(html).toContain("item dois");
  });

  it("não deixa marcação crua no HTML", () => {
    const html = renderToStaticMarkup(<ArtigoMarkdown markdown={MD} />);
    expect(html).not.toContain("## ");
    expect(html).not.toContain("**");
  });

  it("preserva todo o conteúdo do markdown", () => {
    const html = renderToStaticMarkup(<ArtigoMarkdown markdown={MD} />);
    expect(html).toContain("Título do artigo");
    expect(html).toContain("Subtítulo de contexto");
    expect(html).toContain("Primeiro parágrafo");
    expect(html).toContain("Outra seção");
    expect(html).toContain("item um");
    expect(html).toContain("item dois");
    expect(html).toContain("Fonte:");
    expect(html).toContain("GamesIndustry.biz");
  });
});
