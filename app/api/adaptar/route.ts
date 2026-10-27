import { NextRequest, NextResponse } from "next/server";
import { dispararWorkflow, novoIdManual, tokenGithub, verificarSenha } from "@/lib/painel";

// O GitHub aceita até 65.535 caracteres somando todos os inputs do workflow.
const MAX_TEXTO = 50_000;
const MIN_TEXTO = 300;

function erro(mensagem: string, status: number) {
  return NextResponse.json({ ok: false, erro: mensagem }, { status });
}

export async function POST(request: NextRequest) {
  let body: { senha?: unknown; texto?: unknown; fonteUrl?: unknown; fonteNome?: unknown };
  try {
    body = await request.json();
  } catch {
    return erro("Corpo da requisição inválido.", 400);
  }

  const senha = verificarSenha(body.senha);
  if (!senha.ok) return erro(senha.erro, senha.status);

  const texto = typeof body.texto === "string" ? body.texto.replace(/\r\n/g, "\n").trim() : "";
  const fonteUrl = typeof body.fonteUrl === "string" ? body.fonteUrl.trim() : "";
  const fonteNome = typeof body.fonteNome === "string" ? body.fonteNome.trim() : "";

  if (texto.length > MAX_TEXTO) {
    return erro(`O texto tem ${texto.length} caracteres; o limite é ${MAX_TEXTO}.`, 400);
  }
  if (texto.length < MIN_TEXTO && !fonteUrl) {
    return erro("Cole a notícia completa (ou pelo menos informe o link da matéria).", 400);
  }
  if (fonteUrl) {
    try {
      const url = new URL(fonteUrl);
      if (!["http:", "https:"].includes(url.protocol) || fonteUrl.length > 500) throw new Error();
    } catch {
      return erro("O link da fonte não parece uma URL válida.", 400);
    }
  }
  if (!fonteUrl && !fonteNome) {
    return erro("Informe o nome da fonte (ex.: IGN Brasil) ou o link da matéria.", 400);
  }
  if (fonteNome.length > 80) return erro("O nome da fonte está longo demais.", 400);

  if (!tokenGithub()) return erro("RADAR_GITHUB_TOKEN não configurado no Vercel.", 500);

  const id = novoIdManual();
  const resultado = await dispararWorkflow("adaptar-manual.yml", {
    id,
    texto,
    fonte_url: fonteUrl,
    fonte_nome: fonteNome,
  });
  if (!resultado.ok) return erro(resultado.erro, 502);
  return NextResponse.json({ ok: true, id });
}
