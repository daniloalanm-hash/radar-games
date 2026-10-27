// Uso: npx tsx scripts/conferir-adaptacao.ts <arquivo.md>
// Sai com código 1 e lista os problemas se o artigo não estiver no formato.

import { readFileSync } from "node:fs";
import { conferirArtigo } from "../lib/conferencia";

const arquivo = process.argv[2];
if (!arquivo) {
  console.error("informe o arquivo .md");
  process.exit(2);
}

const problemas = conferirArtigo(readFileSync(arquivo, "utf8"));
if (problemas.length > 0) {
  console.error(`Conferência reprovou ${arquivo}:`);
  for (const p of problemas) console.error(`- ${p}`);
  process.exit(1);
}
console.log(`Conferência OK: ${arquivo}`);
