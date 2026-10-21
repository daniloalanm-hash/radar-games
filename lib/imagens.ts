// Busca candidatos de imagem e vídeo para um artigo adaptado.
//
// Ordem de preferência que o redator aplica depois (ver radar-redator.md):
//   1. Material oficial (página do jogo na Steam: capa e screenshots).
//   2. Link do trailer oficial no YouTube (vai como link, não como imagem).
//   3. Imagem de destaque da própria matéria (og:image), só como último
//      recurso e marcada para checagem de direitos.
//
// Este módulo nunca lança erro para quem chama: qualquer falha de rede vira
// uma linha em `erros`, para não derrubar o workflow do radar.

export interface CandidatoSteam {
  appid: number;
  nome: string;
  origem: "link-na-materia" | "busca-por-nome";
  loja: string;
  capa: string | null;
  screenshots: string[];
  desenvolvedoras: string[];
  publicadoras: string[];
}

export interface CandidatoYoutube {
  url: string;
  titulo: string | null;
  canal: string | null;
  canalUrl: string | null;
}

export interface CandidatoMateria {
  url: string;
  site: string;
  imagem: string | null;
}

export interface Candidatos {
  steam: CandidatoSteam[];
  youtube: CandidatoYoutube[];
  materias: CandidatoMateria[];
  erros: string[];
}

type Fetch = typeof fetch;

const UA =
  "Mozilla/5.0 (compatible; RadarGamesBot/1.0; +https://radar-games.vercel.app/metodologia)";
const MAX_STEAM = 4;
const MAX_YOUTUBE = 4;
const MAX_SCREENSHOTS = 3;

// ---------------------------------------------------------------------------
// Extração a partir do HTML (funções puras, cobertas por testes)
// ---------------------------------------------------------------------------

function decodificarEntidades(texto: string): string {
  return texto
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#0*39;/g, "'")
    .replace(/&#x27;/gi, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function lerMeta(html: string, nomes: string[]): string | null {
  const tags = html.match(/<meta\b[^>]*>/gi) ?? [];
  for (const nome of nomes) {
    for (const tag of tags) {
      const chave = tag.match(/\b(?:property|name)\s*=\s*["']([^"']+)["']/i)?.[1];
      if (chave?.toLowerCase() !== nome) continue;
      const valor = tag.match(/\bcontent\s*=\s*"([^"]*)"/i)?.[1] ?? tag.match(/\bcontent\s*=\s*'([^']*)'/i)?.[1];
      if (valor && valor.trim()) return decodificarEntidades(valor.trim());
    }
  }
  return null;
}

function absoluta(url: string, base: string): string | null {
  try {
    const resolvida = new URL(url, base);
    if (resolvida.protocol === "http:") resolvida.protocol = "https:";
    return resolvida.protocol === "https:" ? resolvida.toString() : null;
  } catch {
    return null;
  }
}

export function extrairImagemDestaque(html: string, urlDaPagina: string): string | null {
  const bruta = lerMeta(html, ["og:image:secure_url", "og:image", "twitter:image", "twitter:image:src"]);
  return bruta ? absoluta(bruta, urlDaPagina) : null;
}

export function extrairNomeDoSite(html: string, urlDaPagina: string): string {
  const nome = lerMeta(html, ["og:site_name", "application-name"]);
  if (nome) return nome;
  try {
    return new URL(urlDaPagina).hostname.replace(/^www\./, "");
  } catch {
    return urlDaPagina;
  }
}

export function extrairSteamAppIds(html: string): number[] {
  const ids = new Set<number>();
  const padrao = /store\.steampowered\.com\/(?:app|widget|agecheck\/app)\/(\d{2,9})/gi;
  for (const m of html.matchAll(padrao)) ids.add(Number(m[1]));
  return [...ids];
}

export function extrairYoutubeIds(html: string): string[] {
  const ids = new Set<string>();
  const padroes = [
    /youtube(?:-nocookie)?\.com\/embed\/([A-Za-z0-9_-]{11})/g,
    /youtube\.com\/watch\?(?:[^"'\s<>]*?&(?:amp;)?)?v=([A-Za-z0-9_-]{11})/g,
    /youtu\.be\/([A-Za-z0-9_-]{11})/g,
    /youtube\.com\/shorts\/([A-Za-z0-9_-]{11})/g,
  ];
  for (const padrao of padroes) for (const m of html.matchAll(padrao)) ids.add(m[1]);
  return [...ids];
}

// ---------------------------------------------------------------------------
// Rede
// ---------------------------------------------------------------------------

async function buscar(fetchImpl: Fetch, url: string, tipo: "texto" | "json"): Promise<unknown> {
  const resposta = await fetchImpl(url, {
    headers: { "User-Agent": UA, "Accept-Language": "pt-BR,pt;q=0.9,en;q=0.8" },
    redirect: "follow",
    signal: AbortSignal.timeout(15_000),
  });
  if (!resposta.ok) throw new Error(`HTTP ${resposta.status}`);
  return tipo === "json" ? resposta.json() : resposta.text();
}

interface SteamAppDetails {
  [appid: string]: {
    success?: boolean;
    data?: {
      type?: string;
      name?: string;
      header_image?: string;
      screenshots?: { path_full?: string }[];
      developers?: string[];
      publishers?: string[];
    };
  };
}

async function detalhesSteam(
  fetchImpl: Fetch,
  appid: number,
  origem: CandidatoSteam["origem"],
): Promise<CandidatoSteam | null> {
  const json = (await buscar(
    fetchImpl,
    `https://store.steampowered.com/api/appdetails?appids=${appid}&cc=br&l=portuguese`,
    "json",
  )) as SteamAppDetails;
  const app = json?.[String(appid)];
  if (!app?.success || !app.data?.name) return null;
  const tipo = app.data.type;
  if (tipo && tipo !== "game" && tipo !== "dlc") return null;
  return {
    appid,
    nome: app.data.name,
    origem,
    loja: `https://store.steampowered.com/app/${appid}/`,
    capa: app.data.header_image ?? null,
    screenshots: (app.data.screenshots ?? [])
      .map((s) => s.path_full)
      .filter((s): s is string => Boolean(s))
      .slice(0, MAX_SCREENSHOTS),
    desenvolvedoras: app.data.developers ?? [],
    publicadoras: app.data.publishers ?? [],
  };
}

interface SteamBusca {
  items?: { id?: number; name?: string; type?: string }[];
}

async function buscarNaSteam(fetchImpl: Fetch, jogo: string): Promise<number[]> {
  const json = (await buscar(
    fetchImpl,
    `https://store.steampowered.com/api/storesearch/?term=${encodeURIComponent(jogo)}&cc=br&l=portuguese`,
    "json",
  )) as SteamBusca;
  return (json.items ?? [])
    .filter((item) => typeof item.id === "number" && (!item.type || item.type === "app"))
    .map((item) => item.id as number)
    .slice(0, 2);
}

interface OEmbed {
  title?: string;
  author_name?: string;
  author_url?: string;
}

async function detalhesYoutube(fetchImpl: Fetch, id: string): Promise<CandidatoYoutube> {
  const url = `https://www.youtube.com/watch?v=${id}`;
  try {
    const json = (await buscar(
      fetchImpl,
      `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`,
      "json",
    )) as OEmbed;
    return {
      url,
      titulo: json.title ?? null,
      canal: json.author_name ?? null,
      canalUrl: json.author_url ?? null,
    };
  } catch {
    // Vídeo privado/removido: sem o canal não dá para saber se é oficial,
    // então ele fica de fora.
    return { url, titulo: null, canal: null, canalUrl: null };
  }
}

export async function buscarCandidatos(
  { urls, jogo }: { urls: string[]; jogo?: string },
  fetchImpl: Fetch = fetch,
): Promise<Candidatos> {
  const resultado: Candidatos = { steam: [], youtube: [], materias: [], erros: [] };
  const appIdsDosLinks: number[] = [];
  const youtubeIds: string[] = [];

  for (const url of urls) {
    try {
      const html = (await buscar(fetchImpl, url, "texto")) as string;
      resultado.materias.push({
        url,
        site: extrairNomeDoSite(html, url),
        imagem: extrairImagemDestaque(html, url),
      });
      appIdsDosLinks.push(...extrairSteamAppIds(html));
      youtubeIds.push(...extrairYoutubeIds(html));
    } catch (erro) {
      resultado.erros.push(`matéria ${url}: ${(erro as Error).message}`);
    }
  }

  const vistos = new Set<number>();
  const fila: { appid: number; origem: CandidatoSteam["origem"] }[] = [];
  for (const appid of appIdsDosLinks) {
    if (!vistos.has(appid)) fila.push({ appid, origem: "link-na-materia" });
    vistos.add(appid);
  }
  if (jogo && jogo.trim()) {
    try {
      for (const appid of await buscarNaSteam(fetchImpl, jogo.trim())) {
        if (!vistos.has(appid)) fila.push({ appid, origem: "busca-por-nome" });
        vistos.add(appid);
      }
    } catch (erro) {
      resultado.erros.push(`busca Steam "${jogo}": ${(erro as Error).message}`);
    }
  }
  for (const { appid, origem } of fila.slice(0, MAX_STEAM)) {
    try {
      const candidato = await detalhesSteam(fetchImpl, appid, origem);
      if (candidato) resultado.steam.push(candidato);
    } catch (erro) {
      resultado.erros.push(`Steam app ${appid}: ${(erro as Error).message}`);
    }
  }

  for (const id of [...new Set(youtubeIds)].slice(0, MAX_YOUTUBE)) {
    const video = await detalhesYoutube(fetchImpl, id);
    if (video.canal) resultado.youtube.push(video);
  }

  return resultado;
}
