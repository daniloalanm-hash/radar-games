// Uso:
//   npx tsx scripts/buscar-imagens.ts [--jogo "Nome do Jogo"] <url-da-fonte> [outras-urls...]
//
// Imprime um JSON com os candidatos de imagem e vídeo (ver lib/imagens.ts).
// Sempre termina com código 0: falhar em achar imagem nunca deve parar o radar.

import { buscarCandidatos } from "../lib/imagens";

function lerArgumentos(argv: string[]): { urls: string[]; jogo?: string } {
  const urls: string[] = [];
  let jogo: string | undefined;
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--jogo") {
      jogo = argv[i + 1];
      i++;
    } else if (/^https?:\/\//.test(argv[i])) {
      urls.push(argv[i]);
    }
  }
  return { urls, jogo };
}

const argumentos = lerArgumentos(process.argv.slice(2));

buscarCandidatos(argumentos)
  .then((candidatos) => {
    process.stdout.write(JSON.stringify(candidatos, null, 2) + "\n");
  })
  .catch((erro: Error) => {
    process.stdout.write(
      JSON.stringify({ steam: [], youtube: [], materias: [], erros: [erro.message] }, null, 2) + "\n",
    );
  });
