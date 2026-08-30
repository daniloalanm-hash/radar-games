import { z } from "zod";

export const TIPOS = ["noticia", "lancamento", "vazamento", "rumor", "esports"] as const;
export const ESCOPOS = ["nacional", "internacional"] as const;
export const CONFIABILIDADES = ["confirmado", "rumor"] as const;

const KEBAB = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const DATA_ISO = /^\d{4}-\d{2}-\d{2}$/;

export const fonteSchema = z.object({
  nome: z.string().min(1),
  url: z.string().url(),
  dominio: z.string().min(1),
});

export const itemBaseSchema = z.object({
  slug: z.string().regex(KEBAB, "slug deve ser kebab-case"),
  titulo: z.string().min(1),
  resumo: z.string().min(1),
  tipo: z.enum(TIPOS),
  escopo: z.enum(ESCOPOS),
  confiabilidade: z.enum(CONFIABILIDADES),
  plataformas: z.array(z.string()),
  tags: z.array(z.string()),
  dataFato: z.string().regex(DATA_ISO, "dataFato deve ser AAAA-MM-DD"),
  janelaEstendida: z.boolean(),
  fonte: fonteSchema,
  fontesSecundarias: z.array(fonteSchema),
  nota: z.number().min(0).max(10),
  justificativa: z.string().min(1),
  pesquisador: z.string().min(1),
});

export const itemRankeadoSchema = itemBaseSchema.extend({
  posicao: z.number().int().min(1).max(10),
});

export const descartadoSchema = z.object({
  titulo: z.string().min(1),
  motivo: z.string().min(1),
});

export const edicaoSchema = z
  .object({
    categoria: z.string().min(1),
    data: z.string().regex(DATA_ISO, "data deve ser AAAA-MM-DD"),
    geradoEm: z.string().datetime({ offset: true }),
    janela: z.object({
      inicio: z.string().datetime({ offset: true }),
      fim: z.string().datetime({ offset: true }),
    }),
    observacao: z.string().nullable(),
    itens: z.array(itemRankeadoSchema).max(10),
    tambemNoRadar: z.array(itemBaseSchema),
    descartados: z.array(descartadoSchema),
  })
  .superRefine((edicao, ctx) => {
    edicao.itens.forEach((item, indice) => {
      if (item.posicao !== indice + 1) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["itens", indice, "posicao"],
          message: `posicao deve ser ${indice + 1}, veio ${item.posicao}`,
        });
      }
    });
  });

export type FonteRef = z.infer<typeof fonteSchema>;
export type ItemRadar = z.infer<typeof itemBaseSchema>;
export type ItemRankeado = z.infer<typeof itemRankeadoSchema>;
export type Descartado = z.infer<typeof descartadoSchema>;
export type Edicao = z.infer<typeof edicaoSchema>;
