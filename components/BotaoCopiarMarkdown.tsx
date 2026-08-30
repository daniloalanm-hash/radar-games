"use client";

import { useState } from "react";

export function BotaoCopiarMarkdown({ markdown }: { markdown: string }) {
  const [copiado, setCopiado] = useState(false);

  async function copiar() {
    try {
      await navigator.clipboard.writeText(markdown);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      setCopiado(false);
    }
  }

  return (
    <button
      type="button"
      onClick={copiar}
      className="rounded border border-borda bg-superficie px-3 py-1.5 text-sm text-suave hover:text-texto"
    >
      {copiado ? "Copiado ✓" : "Copiar markdown"}
    </button>
  );
}
