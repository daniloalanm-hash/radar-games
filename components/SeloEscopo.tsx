import type { ItemRadar } from "@/lib/schema";

export function SeloEscopo({ escopo }: { escopo: ItemRadar["escopo"] }) {
  const rotulo = escopo === "nacional" ? "🇧🇷 Brasil" : "🌐 Global";
  return (
    <span className="rounded border border-borda bg-superficie px-2 py-0.5 text-xs text-suave">
      {rotulo}
    </span>
  );
}
