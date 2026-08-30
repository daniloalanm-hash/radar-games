import { readdirSync, readFileSync, existsSync } from "node:fs";
import path from "node:path";
import { edicaoSchema } from "../lib/schema";

const DATA_DIR = path.join(process.cwd(), "data");

function listarArquivos(dir: string): string[] {
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true }).flatMap((entrada) => {
    const caminho = path.join(dir, entrada.name);
    if (entrada.isDirectory()) return listarArquivos(caminho);
    return entrada.name.endsWith(".json") ? [caminho] : [];
  });
}

const arquivos = listarArquivos(DATA_DIR);

if (arquivos.length === 0) {
  console.log("validate:data — nenhum JSON em data/, nada a validar.");
  process.exit(0);
}

let falhas = 0;

for (const arquivo of arquivos) {
  const relativo = path.relative(process.cwd(), arquivo);
  let conteudo: unknown;
  try {
    conteudo = JSON.parse(readFileSync(arquivo, "utf8"));
  } catch (erro) {
    console.error(`✗ ${relativo} — JSON inválido: ${(erro as Error).message}`);
    falhas += 1;
    continue;
  }

  const resultado = edicaoSchema.safeParse(conteudo);
  if (resultado.success) {
    console.log(`✓ ${relativo} — ${resultado.data.itens.length} itens`);
    continue;
  }

  falhas += 1;
  console.error(`✗ ${relativo}`);
  for (const problema of resultado.error.issues) {
    console.error(`    ${problema.path.join(".") || "(raiz)"}: ${problema.message}`);
  }
}

if (falhas > 0) {
  console.error(`\nvalidate:data — ${falhas} arquivo(s) inválido(s).`);
  process.exit(1);
}

console.log(`\nvalidate:data — ${arquivos.length} arquivo(s) válido(s).`);
