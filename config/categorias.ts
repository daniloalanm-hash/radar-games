import { FONTES_GAMES, type FonteCatalogo } from "./fontes";

export interface Categoria {
  slug: string;
  nome: string;
  emoji: string;
  /** Cor de destaque da categoria, em hex. */
  cor: string;
  /** Nomes dos subagentes pesquisadores, na ordem de disparo. */
  agentes: string[];
  fontes: FonteCatalogo[];
}

export const CATEGORIAS: Categoria[] = [
  {
    slug: "games",
    nome: "Games & Esports",
    emoji: "🎮",
    cor: "#7c5cff",
    agentes: [
      "radar-empresas-nacionais",
      "radar-empresas-internacionais",
      "radar-lancamentos-nacionais",
      "radar-lancamentos-internacionais",
      "radar-esports",
    ],
    fontes: FONTES_GAMES,
  },
];

export const CATEGORIA_PADRAO = "games";

export function getCategoria(slug: string): Categoria | undefined {
  return CATEGORIAS.find((categoria) => categoria.slug === slug);
}
