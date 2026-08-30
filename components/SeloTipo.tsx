import type { ItemRadar } from "@/lib/schema";

const ROTULOS: Record<ItemRadar["tipo"], string> = {
  noticia: "Notícia",
  lancamento: "Lançamento",
  vazamento: "Vazamento",
  rumor: "Rumor",
  esports: "Esports",
};

export function SeloTipo({
  tipo,
  confiabilidade,
}: {
  tipo: ItemRadar["tipo"];
  confiabilidade: ItemRadar["confiabilidade"];
}) {
  const naoConfirmado = confiabilidade === "rumor";
  const classe = naoConfirmado
    ? "border-rumor/50 bg-rumor/10 text-rumor"
    : "border-borda bg-superficie text-suave";

  return (
    <span className={`rounded border px-2 py-0.5 text-xs font-medium ${classe}`}>
      {ROTULOS[tipo]}
      {naoConfirmado ? " · não confirmado" : ""}
    </span>
  );
}
