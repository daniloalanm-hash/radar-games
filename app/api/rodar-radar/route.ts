import { NextRequest, NextResponse } from "next/server";
import { dispararWorkflow, tokenGithub, verificarSenha } from "@/lib/painel";

export async function POST(request: NextRequest) {
  let body: { data?: string; senha?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, erro: "Corpo da requisição inválido." }, { status: 400 });
  }

  const senha = verificarSenha(body.senha);
  if (!senha.ok) {
    return NextResponse.json({ ok: false, erro: senha.erro }, { status: senha.status });
  }

  if (body.data && !/^\d{4}-\d{2}-\d{2}$/.test(body.data.trim())) {
    return NextResponse.json({ ok: false, erro: "Data deve estar no formato AAAA-MM-DD." }, { status: 400 });
  }

  if (!tokenGithub()) {
    return NextResponse.json(
      { ok: false, erro: "RADAR_GITHUB_TOKEN não configurado no Vercel." },
      { status: 500 },
    );
  }

  const inputs: Record<string, string> = {};
  if (body.data && body.data.trim()) inputs.data = body.data.trim();

  const resultado = await dispararWorkflow("radar-sob-demanda.yml", inputs);
  if (resultado.ok) return NextResponse.json({ ok: true });
  return NextResponse.json({ ok: false, erro: resultado.erro }, { status: 502 });
}
