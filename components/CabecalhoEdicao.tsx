import type { Edicao } from "@/lib/schema";

function formatarData(data: string): string {
  const [ano, mes, dia] = data.split("-");
  return `${dia}/${mes}/${ano}`;
}

export function CabecalhoEdicao({
  edicao,
  categoriaNome,
}: {
  edicao: Edicao;
  categoriaNome: string;
}) {
  return (
    <div>
      <p className="text-sm text-suave">{categoriaNome}</p>
      <h1 className="mt-1 text-2xl font-bold tracking-tight">
        TOP {edicao.itens.length} de {formatarData(edicao.data)}
      </h1>
      {edicao.observacao ? (
        <p className="mt-3 text-sm text-suave">
          {edicao.observacao}
        </p>
      ) : null}
    </div>
  );
}
