"use client";

import { useState } from "react";

type Alvo = "titulo" | "corpo" | "markdown";

async function copiarRico(html: string, texto: string) {
  if (typeof ClipboardItem !== "undefined" && navigator.clipboard?.write) {
    await navigator.clipboard.write([
      new ClipboardItem({
        "text/html": new Blob([html], { type: "text/html" }),
        "text/plain": new Blob([texto], { type: "text/plain" }),
      }),
    ]);
    return;
  }
  await navigator.clipboard.writeText(texto);
}

export function BotoesWordPress({
  titulo,
  html,
  texto,
  markdown,
}: {
  titulo: string;
  html: string;
  texto: string;
  markdown: string;
}) {
  const [copiado, setCopiado] = useState<Alvo | null>(null);
  const [falhou, setFalhou] = useState(false);

  async function copiar(alvo: Alvo) {
    setFalhou(false);
    try {
      if (alvo === "titulo") await navigator.clipboard.writeText(titulo);
      else if (alvo === "corpo") await copiarRico(html, texto);
      else await navigator.clipboard.writeText(markdown);
      setCopiado(alvo);
      setTimeout(() => setCopiado((atual) => (atual === alvo ? null : atual)), 2500);
    } catch {
      setFalhou(true);
    }
  }

  const base =
    "rounded-md border px-3 py-2 text-sm transition-colors disabled:opacity-50";
  const principal = `${base} border-destaque bg-destaque font-medium text-white hover:bg-destaque/90`;
  const secundario = `${base} border-borda bg-superficie text-suave hover:text-texto`;

  return (
    <div className="space-y-3 rounded-lg border border-borda bg-superficie/60 p-4">
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={() => copiar("titulo")} className={secundario}>
          {copiado === "titulo" ? "Título copiado ✓" : "1. Copiar título"}
        </button>
        <button type="button" onClick={() => copiar("corpo")} className={principal}>
          {copiado === "corpo" ? "Texto copiado ✓" : "2. Copiar texto para o WordPress"}
        </button>
        <button type="button" onClick={() => copiar("markdown")} className={secundario}>
          {copiado === "markdown" ? "Markdown copiado ✓" : "Copiar markdown"}
        </button>
      </div>
      <p className="text-xs leading-relaxed text-suave">
        Cole o título no campo de título do post. Depois clique no corpo do post e cole o texto:
        subtítulos, negritos, listas e links já entram formatados.
      </p>
      {falhou && (
        <p className="text-xs text-rumor">
          O navegador bloqueou a cópia. Tente de novo clicando direto no botão.
        </p>
      )}
    </div>
  );
}
