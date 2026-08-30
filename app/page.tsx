import { CATEGORIA_PADRAO, getCategoria } from "@/config/categorias";
import { ultimaEdicao } from "@/lib/edicoes";
import { EdicaoView } from "@/components/EdicaoView";

export default function Home() {
  const categoria = getCategoria(CATEGORIA_PADRAO)!;
  const edicao = ultimaEdicao(CATEGORIA_PADRAO);

  if (!edicao) {
    return (
      <p className="text-suave">
        Ainda não há edições. Rode <code>/radar-games</code> para gerar a primeira.
      </p>
    );
  }

  return <EdicaoView edicao={edicao} categoria={categoria} />;
}
