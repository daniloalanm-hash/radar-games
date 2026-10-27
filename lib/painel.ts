// Acesso protegido por senha às ações que disparam workflows no GitHub
// (rodar o radar, adaptar uma notícia colada).

import { randomBytes, timingSafeEqual } from "node:crypto";

export const REPO = "daniloalanm-hash/radar-games";

export function senhaConfere(recebida: string, esperada: string): boolean {
  const a = Buffer.from(recebida);
  const b = Buffer.from(esperada);
  return a.length === b.length && timingSafeEqual(a, b);
}

export type ResultadoSenha = { ok: true } | { ok: false; status: number; erro: string };

/** Sem senha configurada, o painel fica desligado (falha fechada). */
export function verificarSenha(senha: unknown): ResultadoSenha {
  const esperada = process.env.RADAR_PAINEL_SENHA;
  if (!esperada) {
    return {
      ok: false,
      status: 503,
      erro: "Painel desativado: RADAR_PAINEL_SENHA não configurada no Vercel.",
    };
  }
  if (typeof senha !== "string" || !senha || !senhaConfere(senha, esperada)) {
    return { ok: false, status: 401, erro: "Senha incorreta." };
  }
  return { ok: true };
}

export function tokenGithub(): string | null {
  return process.env.RADAR_GITHUB_TOKEN || null;
}

export async function githubApi(caminho: string, init: RequestInit = {}): Promise<Response> {
  const token = tokenGithub();
  if (!token) throw new Error("RADAR_GITHUB_TOKEN não configurado no Vercel.");
  return fetch(`https://api.github.com/repos/${REPO}${caminho}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      "Content-Type": "application/json",
      ...init.headers,
    },
    cache: "no-store",
  });
}

export async function dispararWorkflow(
  arquivo: string,
  inputs: Record<string, string>,
): Promise<{ ok: true } | { ok: false; erro: string }> {
  const resposta = await githubApi(`/actions/workflows/${arquivo}/dispatches`, {
    method: "POST",
    body: JSON.stringify({ ref: "main", inputs }),
  });
  if (resposta.status === 204) return { ok: true };
  return { ok: false, erro: `GitHub respondeu ${resposta.status}: ${await resposta.text()}` };
}

/** AAAAMMDD-HHMMSS-xxxx no horário de Brasília. */
export function novoIdManual(agora: Date = new Date()): string {
  const partes = Object.fromEntries(
    new Intl.DateTimeFormat("en-CA", {
      timeZone: "America/Sao_Paulo",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hourCycle: "h23",
    })
      .formatToParts(agora)
      .map((p) => [p.type, p.value]),
  );
  const alfabeto = "abcdefghijklmnopqrstuvwxyz0123456789";
  const sufixo = [...randomBytes(4)].map((b) => alfabeto[b % alfabeto.length]).join("");
  return `${partes.year}${partes.month}${partes.day}-${partes.hour}${partes.minute}${partes.second}-${sufixo}`;
}

export interface ExecucaoGithub {
  display_title?: string;
  status?: string | null;
  conclusion?: string | null;
  html_url?: string;
}

export type EstadoAdaptacao =
  | { estado: "fila" | "escrevendo"; log: string | null }
  | { estado: "concluido"; log: string | null }
  | { estado: "falhou"; log: string | null; motivo: string };

export function estadoDaExecucao(execucoes: ExecucaoGithub[], id: string): EstadoAdaptacao {
  const execucao = execucoes.find((e) => (e.display_title ?? "").includes(id));
  if (!execucao) return { estado: "fila", log: null };
  const log = execucao.html_url ?? null;
  if (execucao.status !== "completed") {
    return { estado: execucao.status === "in_progress" ? "escrevendo" : "fila", log };
  }
  if (execucao.conclusion === "success") return { estado: "concluido", log };
  return {
    estado: "falhou",
    log,
    motivo:
      execucao.conclusion === "cancelled"
        ? "A execução foi cancelada no GitHub."
        : "O redator ou a conferência falhou. Veja o log no GitHub.",
  };
}
