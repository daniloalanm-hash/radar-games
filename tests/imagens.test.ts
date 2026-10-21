import { describe, expect, it } from "vitest";
import {
  buscarCandidatos,
  extrairImagemDestaque,
  extrairNomeDoSite,
  extrairSteamAppIds,
  extrairYoutubeIds,
} from "../lib/imagens";

const MATERIA = `<!doctype html><html><head>
<meta property="og:site_name" content="Portal Exemplo" />
<meta content="/imagens/capa.jpg?w=1200&amp;h=630" property="og:image">
<meta name="twitter:image" content="https://cdn.exemplo.com/outra.jpg">
</head><body>
<p>Já na <a href="https://store.steampowered.com/app/1030300/Hollow_Knight_Silksong/">Steam</a>.</p>
<iframe src="https://www.youtube.com/embed/AbCdEfGhIjK?rel=0"></iframe>
<a href="https://www.youtube.com/watch?feature=share&amp;v=ZyXwVuTsRqP">trailer</a>
<a href="https://store.steampowered.com/app/1030300/">de novo</a>
</body></html>`;

describe("extração do HTML", () => {
  it("lê a og:image e resolve URL relativa para https", () => {
    expect(extrairImagemDestaque(MATERIA, "http://portal.exemplo.com/noticia/1")).toBe(
      "https://portal.exemplo.com/imagens/capa.jpg?w=1200&h=630",
    );
  });

  it("cai para twitter:image quando não há og:image", () => {
    const html = `<meta name="twitter:image" content="https://cdn.exemplo.com/t.jpg">`;
    expect(extrairImagemDestaque(html, "https://x.com/a")).toBe("https://cdn.exemplo.com/t.jpg");
  });

  it("devolve null sem imagem", () => {
    expect(extrairImagemDestaque("<html></html>", "https://x.com")).toBeNull();
  });

  it("usa og:site_name ou o domínio", () => {
    expect(extrairNomeDoSite(MATERIA, "https://portal.exemplo.com/n")).toBe("Portal Exemplo");
    expect(extrairNomeDoSite("<html></html>", "https://www.ign.com/x")).toBe("ign.com");
  });

  it("acha appids da Steam sem repetir", () => {
    expect(extrairSteamAppIds(MATERIA)).toEqual([1030300]);
  });

  it("acha vídeos do YouTube em embed e watch com parâmetros", () => {
    expect(extrairYoutubeIds(MATERIA).sort()).toEqual(["AbCdEfGhIjK", "ZyXwVuTsRqP"].sort());
    expect(extrairYoutubeIds(`<a href="https://youtu.be/12345678901">`)).toEqual(["12345678901"]);
  });
});

function fetchFalso(rotas: Record<string, unknown>): typeof fetch {
  return (async (entrada: RequestInfo | URL) => {
    const url = String(entrada);
    const chave = Object.keys(rotas).find((prefixo) => url.startsWith(prefixo));
    if (!chave) return new Response("não encontrado", { status: 404 });
    const corpo = rotas[chave];
    return new Response(typeof corpo === "string" ? corpo : JSON.stringify(corpo), { status: 200 });
  }) as typeof fetch;
}

const APP = {
  "1030300": {
    success: true,
    data: {
      type: "game",
      name: "Hollow Knight: Silksong",
      header_image: "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/1030300/header.jpg",
      screenshots: [{ path_full: "https://cdn/s1.jpg" }, { path_full: "https://cdn/s2.jpg" }],
      developers: ["Team Cherry"],
      publishers: ["Team Cherry"],
    },
  },
};

describe("buscarCandidatos", () => {
  it("monta Steam, YouTube e matéria a partir da página da fonte", async () => {
    const r = await buscarCandidatos(
      { urls: ["https://portal.exemplo.com/noticia/1"] },
      fetchFalso({
        "https://portal.exemplo.com/noticia/1": MATERIA,
        "https://store.steampowered.com/api/appdetails?appids=1030300": APP,
        "https://www.youtube.com/oembed?url=https%3A%2F%2Fwww.youtube.com%2Fwatch%3Fv%3DAbCdEfGhIjK": {
          title: "Silksong - Trailer de lançamento",
          author_name: "Team Cherry",
          author_url: "https://www.youtube.com/@TeamCherry",
        },
      }),
    );
    expect(r.materias).toEqual([
      {
        url: "https://portal.exemplo.com/noticia/1",
        site: "Portal Exemplo",
        imagem: "https://portal.exemplo.com/imagens/capa.jpg?w=1200&h=630",
      },
    ]);
    expect(r.steam).toHaveLength(1);
    expect(r.steam[0]).toMatchObject({
      appid: 1030300,
      nome: "Hollow Knight: Silksong",
      origem: "link-na-materia",
      desenvolvedoras: ["Team Cherry"],
      screenshots: ["https://cdn/s1.jpg", "https://cdn/s2.jpg"],
    });
    // O vídeo sem oEmbed (removido/privado) fica de fora.
    expect(r.youtube).toEqual([
      {
        url: "https://www.youtube.com/watch?v=AbCdEfGhIjK",
        titulo: "Silksong - Trailer de lançamento",
        canal: "Team Cherry",
        canalUrl: "https://www.youtube.com/@TeamCherry",
      },
    ]);
  });

  it("busca na Steam pelo nome quando a matéria não tem link", async () => {
    const r = await buscarCandidatos(
      { urls: ["https://site.com/n"], jogo: "Silksong" },
      fetchFalso({
        "https://site.com/n": "<html></html>",
        "https://store.steampowered.com/api/storesearch/": { items: [{ id: 1030300, type: "app", name: "x" }] },
        "https://store.steampowered.com/api/appdetails?appids=1030300": APP,
      }),
    );
    expect(r.steam.map((s) => [s.appid, s.origem])).toEqual([[1030300, "busca-por-nome"]]);
  });

  it("nunca lança: falhas viram erros", async () => {
    const r = await buscarCandidatos({ urls: ["https://fora-do-ar.com/x"], jogo: "Nada" }, fetchFalso({}));
    expect(r.steam).toEqual([]);
    expect(r.materias).toEqual([]);
    expect(r.erros.length).toBe(2);
  });
});
