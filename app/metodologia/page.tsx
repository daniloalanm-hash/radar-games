import type { Metadata } from "next";

export const metadata: Metadata = { title: "Metodologia — Radar Games" };

export default function PaginaMetodologia() {
  return (
    <article className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Como o Radar é produzido</h1>

      <section className="space-y-3 text-sm leading-relaxed text-suave">
        <p>
          Toda edição nasce de cinco pesquisadores rodando em paralelo, cada um com um recorte
          próprio: empresas nacionais, empresas internacionais, lançamentos nacionais, lançamentos
          internacionais e esports. Cada um varre as fontes da categoria na janela das últimas 24
          horas e devolve até seis candidatos, sempre com URL verificável.
        </p>
        <p>
          Os cerca de trinta candidatos vão para um verificador único. Ele deduplica — quando a
          mesma notícia aparece em mais de um pesquisador, fica apenas a melhor fonte, e as demais
          viram fontes secundárias —, confirma o que estiver duvidoso na origem, descarta o que não
          tiver fonte confiável ou estiver fora da janela, e rankeia o TOP 10.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Critérios de ranking</h2>
        <ol className="list-decimal space-y-1 pl-5 text-sm text-suave">
          <li>Impacto e relevância para o público gamer — peso alto</li>
          <li>Atualidade — o fato é realmente do dia?</li>
          <li>Credibilidade da fonte</li>
          <li>Ineditismo e exclusividade</li>
          <li>Penalidade para rumor não confirmado</li>
        </ol>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Regras fixas</h2>
        <ul className="list-disc space-y-1 pl-5 text-sm text-suave">
          <li>Nenhum item entra sem fonte verificável.</li>
          <li>Rumor e vazamento são publicados marcados como não confirmados.</li>
          <li>
            Quando o dia rende menos de dez destaques, a edição sai menor. O TOP 10 nunca é
            completado com item fraco.
          </li>
        </ul>
      </section>
    </article>
  );
}
