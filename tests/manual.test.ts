import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { carregarManual, ID_MANUAL, listarManuais } from "../lib/manual";
import { paraWordPress } from "../lib/wordpress";
import { conferirArtigo } from "../lib/conferencia";
import { estadoDaExecucao, novoIdManual, verificarSenha } from "../lib/painel";

const CTA = `**Quer aproveitar seus próximos jogos?**

Na Loja dos Gifts, você encontra jogos, Gift Cards e créditos digitais para PlayStation, Xbox, Nintendo, PC, mobile e outras plataformas.

Acesse a Loja dos Gifts e confira as ofertas: [www.lojadosgifts.com.br](https://www.lojadosgifts.com.br)`;

const corpoLongo = Array.from({ length: 60 }, (_, i) => `palavra${i}`).join(" ");

const ARTIGO = `---
titulo: Saros recebe grande atualização gratuita no PS5
data: 2026-10-20
categoria: manual
posicao: 0
slug: saros-recebe-atualizacao-zenith
fonteUrl:
fonteNome: Notícias de Jogos
plataformas: PS5
---

## Saros recebe grande atualização gratuita no PS5

## Atualização Zenith adiciona novos modos e 12 colecionáveis

A **Housemarque** lançou a atualização em 19 de outubro. ${corpoLongo}

## Eclipse Layers traz uma nova campanha

Texto com <script>alert(1)</script> e [link](javascript:alert(1)). ${corpoLongo}

- 10 novos **Modificadores de Proteção**
- Mira por sensor de movimento

## O que mais chegou

${corpoLongo} ${corpoLongo}

Qual novidade chamou mais sua atenção?

${CTA}

**Fonte:** Notícias de Jogos
`;

let base: string;

beforeAll(() => {
  base = mkdtempSync(path.join(tmpdir(), "radar-manual-"));
  writeFileSync(path.join(base, "20261020-101500-ab12.md"), ARTIGO);
  writeFileSync(path.join(base, "20261021-090000-zz99.md"), ARTIGO.replace("Saros recebe", "Outro"));
  writeFileSync(path.join(base, "nome-invalido.md"), ARTIGO);
});

afterAll(() => rmSync(base, { recursive: true, force: true }));

describe("artigos manuais", () => {
  it("valida o formato do id", () => {
    expect(ID_MANUAL.test("20261020-101500-ab12")).toBe(true);
    expect(ID_MANUAL.test("../../etc/passwd")).toBe(false);
    expect(ID_MANUAL.test("20261020-101500-AB12")).toBe(false);
  });

  it("carrega frontmatter e corpo", () => {
    const a = carregarManual("20261020-101500-ab12", base)!;
    expect(a.titulo).toBe("Saros recebe grande atualização gratuita no PS5");
    expect(a.data).toBe("2026-10-20");
    expect(a.fonteUrl).toBeNull();
    expect(a.fonteNome).toBe("Notícias de Jogos");
    expect(a.plataformas).toEqual(["PS5"]);
    expect(a.markdown.startsWith("## Saros")).toBe(true);
  });

  it("recusa id fora do formato mesmo que o arquivo exista", () => {
    expect(carregarManual("nome-invalido", base)).toBeNull();
  });

  it("lista do mais recente para o mais antigo, ignorando nomes inválidos", () => {
    expect(listarManuais(base).map((a) => a.id)).toEqual([
      "20261021-090000-zz99",
      "20261020-101500-ab12",
    ]);
  });

  it("pasta inexistente vira lista vazia", () => {
    expect(listarManuais(path.join(base, "nao-existe"))).toEqual([]);
  });
});

describe("paraWordPress", () => {
  const { titulo, html, texto } = paraWordPress(ARTIGO.split("---\n").slice(2).join("---\n"));

  it("separa o título do corpo", () => {
    expect(titulo).toBe("Saros recebe grande atualização gratuita no PS5");
    expect(html).not.toContain("Saros recebe grande atualização gratuita no PS5</h2>");
  });

  it("converte subtítulos, negrito, listas e links", () => {
    expect(html).toContain("<h2>Atualização Zenith adiciona novos modos e 12 colecionáveis</h2>");
    expect(html).toContain("<strong>Housemarque</strong>");
    expect(html).toContain("<ul><li>10 novos <strong>Modificadores de Proteção</strong></li>");
    expect(html).toContain('<a href="https://www.lojadosgifts.com.br/">www.lojadosgifts.com.br</a>');
    expect(html).toContain("<p><strong>Fonte:</strong> Notícias de Jogos</p>");
  });

  it("escapa HTML e descarta link perigoso", () => {
    expect(html).toContain("&lt;script&gt;");
    expect(html).not.toContain("<script>");
    expect(html).not.toContain("javascript:");
  });

  it("gera texto puro sem marcação", () => {
    expect(texto).not.toContain("**");
    expect(texto).not.toContain("## ");
    expect(texto).toContain("• Mira por sensor de movimento");
  });
});

describe("conferirArtigo", () => {
  it("aprova um artigo no formato", () => {
    expect(conferirArtigo(ARTIGO)).toEqual([]);
  });

  it("aponta CTA alterado, fonte faltando e título fora do padrão", () => {
    const ruim = ARTIGO.replace("**Quer aproveitar seus próximos jogos?**", "Compre agora!")
      .replace("**Fonte:** Notícias de Jogos", "Fim.")
      .replace("## Saros recebe grande atualização gratuita no PS5\n", "# Saros\n");
    const problemas = conferirArtigo(ruim).join(" | ");
    expect(problemas).toContain("CTA");
    expect(problemas).toContain("Fonte");
    expect(problemas).toContain("título");
  });

  // Os de agosto e setembro usavam o modelo anterior (### e outro CTA).
  it("aprova todos os artigos do modelo atual (outubro em diante)", () => {
    const raiz = path.join(process.cwd(), "content", "adaptacoes", "games");
    const reprovados: string[] = [];
    for (const dia of readdirSync(raiz).filter((d) => d >= "2026-10-01")) {
      for (const arquivo of readdirSync(path.join(raiz, dia))) {
        const problemas = conferirArtigo(readFileSync(path.join(raiz, dia, arquivo), "utf8"));
        if (problemas.length) reprovados.push(`${dia}/${arquivo}: ${problemas.join("; ")}`);
      }
    }
    expect(reprovados).toEqual([]);
  });
});

describe("painel", () => {
  it("gera id no horário de Brasília", () => {
    const id = novoIdManual(new Date("2026-10-27T02:30:15Z"));
    expect(id).toMatch(/^20261026-233015-[a-z0-9]{4}$/);
    expect(ID_MANUAL.test(id)).toBe(true);
  });

  it("senha: falha fechada sem configuração, recusa errada, aceita certa", () => {
    vi.stubEnv("RADAR_PAINEL_SENHA", "");
    expect(verificarSenha("x")).toMatchObject({ ok: false, status: 503 });
    vi.stubEnv("RADAR_PAINEL_SENHA", "segredo");
    expect(verificarSenha("errada")).toMatchObject({ ok: false, status: 401 });
    expect(verificarSenha(undefined)).toMatchObject({ ok: false, status: 401 });
    expect(verificarSenha("segredo")).toEqual({ ok: true });
    vi.unstubAllEnvs();
  });

  it("traduz a execução do GitHub em estado da adaptação", () => {
    const id = "20261020-101500-ab12";
    const run = (status: string, conclusion: string | null) => [
      { display_title: "Adaptar notícia outro", status: "completed", conclusion: "failure" },
      { display_title: `Adaptar notícia ${id}`, status, conclusion, html_url: "https://gh/run" },
    ];
    expect(estadoDaExecucao([], id).estado).toBe("fila");
    expect(estadoDaExecucao(run("queued", null), id).estado).toBe("fila");
    expect(estadoDaExecucao(run("in_progress", null), id).estado).toBe("escrevendo");
    expect(estadoDaExecucao(run("completed", "success"), id)).toEqual({
      estado: "concluido",
      log: "https://gh/run",
    });
    expect(estadoDaExecucao(run("completed", "failure"), id).estado).toBe("falhou");
  });
});
