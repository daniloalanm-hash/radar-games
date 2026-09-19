import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  let body: { data?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, erro: "Corpo da requisição inválido." }, { status: 400 });
  }

  const token = process.env.RADAR_GITHUB_TOKEN;
  if (!token) {
    return NextResponse.json(
      { ok: false, erro: "RADAR_GITHUB_TOKEN não configurado no servidor." },
      { status: 500 }
    );
  }

  const inputs: Record<string, string> = {};
  if (body.data && body.data.trim()) {
    inputs.data = body.data.trim();
  }

  const resposta = await fetch(
    "https://api.github.com/repos/daniloalanm-hash/radar-games/actions/workflows/radar-sob-demanda.yml/dispatches",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ ref: "main", inputs }),
    }
  );

  if (resposta.status === 204) {
    return NextResponse.json({ ok: true });
  }

  const detalhe = await resposta.text();
  return NextResponse.json(
    { ok: false, erro: `GitHub respondeu ${resposta.status}: ${detalhe}` },
    { status: 502 }
  );
}
