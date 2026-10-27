import { NextRequest, NextResponse } from "next/server";
import { ID_MANUAL } from "@/lib/manual";
import { estadoDaExecucao, githubApi, tokenGithub, type ExecucaoGithub } from "@/lib/painel";

export const dynamic = "force-dynamic";

// Diz em que pé está a adaptação de um id: na fila, escrevendo, concluída
// (o site ainda vai republicar) ou falhou. Só expõe o estado, nada do texto.
export async function GET(request: NextRequest) {
  const id = request.nextUrl.searchParams.get("id") ?? "";
  if (!ID_MANUAL.test(id)) {
    return NextResponse.json({ ok: false, erro: "id inválido." }, { status: 400 });
  }
  if (!tokenGithub()) {
    return NextResponse.json(
      { ok: false, erro: "RADAR_GITHUB_TOKEN não configurado no Vercel." },
      { status: 500 },
    );
  }

  const resposta = await githubApi(
    "/actions/workflows/adaptar-manual.yml/runs?event=workflow_dispatch&per_page=30",
  );
  if (!resposta.ok) {
    return NextResponse.json(
      { ok: false, erro: `GitHub respondeu ${resposta.status}.` },
      { status: 502 },
    );
  }
  const json = (await resposta.json()) as { workflow_runs?: ExecucaoGithub[] };
  return NextResponse.json({ ok: true, ...estadoDaExecucao(json.workflow_runs ?? [], id) });
}
