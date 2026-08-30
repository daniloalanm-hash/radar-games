export type EscopoFonte = "nacional" | "internacional" | "esports";

export interface FonteCatalogo {
  nome: string;
  url: string;
  escopo: EscopoFonte;
  /** 1 a 10. Usado pelo verificador como desempate de credibilidade. */
  peso: number;
}

export const FONTES_GAMES: FonteCatalogo[] = [
  // Nacionais — informadas pelo usuário
  { nome: "Adrenaline", url: "https://www.adrenaline.com.br/games/", escopo: "nacional", peso: 7 },
  { nome: "Omelete", url: "https://www.omelete.com.br/games", escopo: "nacional", peso: 7 },
  { nome: "IGN Brasil", url: "https://br.ign.com/", escopo: "nacional", peso: 8 },
  { nome: "Flow Games", url: "https://flowgames.gg/noticias/", escopo: "nacional", peso: 6 },
  { nome: "E-Nerd", url: "https://www.einerd.com/secao/games/", escopo: "nacional", peso: 5 },
  // Nacionais — acrescentadas
  { nome: "The Enemy", url: "https://www.theenemy.com.br/", escopo: "nacional", peso: 7 },
  { nome: "Voxel (TecMundo)", url: "https://www.tecmundo.com.br/voxel", escopo: "nacional", peso: 7 },
  { nome: "Canaltech Games", url: "https://canaltech.com.br/games/", escopo: "nacional", peso: 6 },
  { nome: "Critical Hits", url: "https://www.criticalhits.com.br/", escopo: "nacional", peso: 6 },
  { nome: "Drops de Jogos", url: "https://dropsdejogos.uol.com.br/", escopo: "nacional", peso: 5 },

  // Internacionais — informadas pelo usuário
  { nome: "Eurogamer Portugal", url: "https://www.eurogamer.pt/", escopo: "internacional", peso: 7 },
  { nome: "GameSpot", url: "https://www.gamespot.com/category/news/", escopo: "internacional", peso: 8 },
  { nome: "Game Informer", url: "https://gameinformer.com/news", escopo: "internacional", peso: 8 },
  { nome: "Insider Gaming", url: "https://insider-gaming.com/category/news/", escopo: "internacional", peso: 6 },
  // Internacionais — acrescentadas
  { nome: "GamesIndustry.biz", url: "https://www.gamesindustry.biz/", escopo: "internacional", peso: 10 },
  { nome: "Video Games Chronicle", url: "https://www.videogameschronicle.com/", escopo: "internacional", peso: 9 },
  { nome: "Eurogamer", url: "https://www.eurogamer.net/", escopo: "internacional", peso: 9 },
  { nome: "PC Gamer", url: "https://www.pcgamer.com/", escopo: "internacional", peso: 8 },
  { nome: "Polygon", url: "https://www.polygon.com/", escopo: "internacional", peso: 8 },
  { nome: "The Verge — Gaming", url: "https://www.theverge.com/games", escopo: "internacional", peso: 8 },
  { nome: "Game Developer", url: "https://www.gamedeveloper.com/", escopo: "internacional", peso: 8 },
  { nome: "Nintendo Life", url: "https://www.nintendolife.com/", escopo: "internacional", peso: 7 },

  // Esports
  { nome: "Dust2 Brasil", url: "https://www.dust2.com.br/", escopo: "esports", peso: 7 },
  { nome: "HLTV", url: "https://www.hltv.org/", escopo: "esports", peso: 9 },
  { nome: "Dot Esports", url: "https://dotesports.com/", escopo: "esports", peso: 8 },
  { nome: "Esports Insider", url: "https://esportsinsider.com/", escopo: "esports", peso: 8 },
  { nome: "Liquipedia", url: "https://liquipedia.net/", escopo: "esports", peso: 7 },
];
