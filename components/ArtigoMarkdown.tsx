import type { ReactNode } from "react";

function comNegrito(texto: string): ReactNode[] {
  return texto.split(/(\*\*[^*]+\*\*)/g).map((pedaco, indice) =>
    pedaco.startsWith("**") && pedaco.endsWith("**") ? (
      <strong key={indice}>{pedaco.slice(2, -2)}</strong>
    ) : (
      <span key={indice}>{pedaco}</span>
    ),
  );
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
              {comNegrito(bloco.slice(3))}
            </h1>
          );
        }

        if (bloco.startsWith("### ")) {
          return (
            <h2 key={indice} className="pt-2 text-lg font-semibold">
              {comNegrito(bloco.slice(4))}
            </h2>
          );
        }

        if (linhas.every((linha) => linha.startsWith("- "))) {
          return (
            <ul key={indice} className="list-disc space-y-1 pl-5 text-suave">
              {linhas.map((linha, i) => (
                <li key={i}>{comNegrito(linha.slice(2))}</li>
              ))}
            </ul>
          );
        }

        return (
          <p key={indice} className="leading-relaxed text-suave">
            {comNegrito(bloco.replace(/\r?\n/g, " "))}
          </p>
        );
      })}
    </div>
  );
}
