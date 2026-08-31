import type { ReactNode } from "react";

// Tokenizador inline deliberadamente restrito a **negrito** e [texto](url) —
// o subset é o contrato de formatação com o agente radar-redator. Não trocar
// por uma dependência de markdown (ver task brief).
const TOKEN = /(\*\*[^*]+\*\*|\[[^\]]+\]\([^)]+\))/g;
const LINK = /^\[([^\]]+)\]\(([^)]+)\)$/;

function comFormatacao(texto: string): ReactNode[] {
  return texto.split(TOKEN).map((pedaco, indice) => {
    if (pedaco.startsWith("**") && pedaco.endsWith("**")) {
      return <strong key={indice}>{pedaco.slice(2, -2)}</strong>;
    }

    const link = pedaco.match(LINK);
    if (link) {
      const [, rotulo, url] = link;
      return (
        <a
          key={indice}
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="underline decoration-borda underline-offset-4 hover:text-texto"
        >
          {rotulo}
        </a>
      );
    }

    return <span key={indice}>{pedaco}</span>;
  });
}

export function ArtigoMarkdown({ markdown }: { markdown: string }) {
  const blocos = markdown.trim().split(/\r?\n\r?\n/);

  return (
    <div className="space-y-4">
      {blocos.map((bloco, indice) => {
        const linhas = bloco.split(/\r?\n/);

        if (bloco.startsWith("## ")) {
          return (
            <h1 key={indice} className="text-2xl font-bold leading-tight tracking-tight">
              {comFormatacao(bloco.slice(3))}
            </h1>
          );
        }

        if (bloco.startsWith("### ")) {
          return (
            <h2 key={indice} className="pt-2 text-lg font-semibold">
              {comFormatacao(bloco.slice(4))}
            </h2>
          );
        }

        if (linhas.every((linha) => linha.startsWith("- "))) {
          return (
            <ul key={indice} className="list-disc space-y-1 pl-5 text-suave">
              {linhas.map((linha, i) => (
                <li key={i}>{comFormatacao(linha.slice(2))}</li>
              ))}
            </ul>
          );
        }

        return (
          <p key={indice} className="leading-relaxed text-suave">
            {comFormatacao(bloco.replace(/\r?\n/g, " "))}
          </p>
        );
      })}
    </div>
  );
}
