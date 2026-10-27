"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

type Fase = "ocioso" | "enviando" | "fila" | "escrevendo" | "publicando" | "pronto" | "erro";

interface Pendente {
  id: string;
  desde: number;
}

const CHAVE_SENHA = "radar-painel-senha";
const CHAVE_PENDENTE = "radar-adaptacao-pendente";
const INTERVALO_MS = 10_000;
const LIMITE_MS = 25 * 60_000;

function ler(chave: string): string | null {
  try {
    return localStorage.getItem(chave);
  } catch {
    return null;
  }
}
function gravar(chave: string, valor: string | null) {
  try {
    if (valor === null) localStorage.removeItem(chave);
    else localStorage.setItem(chave, valor);
  } catch {
    /* navegação privada: segue sem lembrar */
  }
}

const ETAPAS: { fase: Fase; rotulo: string }[] = [
  { fase: "fila", rotulo: "Na fila do GitHub" },
  { fase: "escrevendo", rotulo: "Redator escrevendo (2 a 4 min)" },
  { fase: "publicando", rotulo: "Publicando no site (cerca de 1 min)" },
  { fase: "pronto", rotulo: "Pronto para copiar" },
];

export function FormAdaptar() {
  const [texto, setTexto] = useState("");
  const [fonteUrl, setFonteUrl] = useState("");
  const [fonteNome, setFonteNome] = useState("");
  const [senha, setSenha] = useState("");
  const [fase, setFase] = useState<Fase>("ocioso");
  const [mensagem, setMensagem] = useState("");
  const [log, setLog] = useState<string | null>(null);
  const [pendente, setPendente] = useState<Pendente | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setSenha(ler(CHAVE_SENHA) ?? "");
    const salvo = ler(CHAVE_PENDENTE);
    if (salvo) {
      try {
        const p = JSON.parse(salvo) as Pendente;
        if (Date.now() - p.desde < LIMITE_MS) {
          setPendente(p);
          setFase("fila");
        } else gravar(CHAVE_PENDENTE, null);
      } catch {
        gravar(CHAVE_PENDENTE, null);
      }
    }
  }, []);

  const acompanhar = useCallback(async (p: Pendente) => {
    if (Date.now() - p.desde > LIMITE_MS) {
      setFase("erro");
      setMensagem("Passou de 25 minutos sem terminar. Confira o log no GitHub.");
      gravar(CHAVE_PENDENTE, null);
      return;
    }

    // Se a página do artigo já existe, acabou (vale também depois de recarregar).
    try {
      const pagina = await fetch(`/manual/${p.id}`, { method: "HEAD", cache: "no-store" });
      if (pagina.ok) {
        setFase("pronto");
        gravar(CHAVE_PENDENTE, null);
        return;
      }
    } catch {
      /* tenta de novo no próximo ciclo */
    }

    try {
      const resposta = await fetch(`/api/adaptar/status?id=${p.id}`, { cache: "no-store" });
      const json = await resposta.json();
      if (json.log) setLog(json.log);
      if (!json.ok) {
        setMensagem(json.erro ?? "Não consegui consultar o andamento.");
      } else if (json.estado === "falhou") {
        setFase("erro");
        setMensagem(json.motivo);
        gravar(CHAVE_PENDENTE, null);
        return;
      } else if (json.estado === "concluido") {
        setFase("publicando");
      } else {
        setFase(json.estado);
      }
    } catch {
      /* rede instável: segue tentando */
    }

    timer.current = setTimeout(() => acompanhar(p), INTERVALO_MS);
  }, []);

  useEffect(() => {
    if (!pendente) return;
    acompanhar(pendente);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [pendente, acompanhar]);

  async function enviar(evento: React.FormEvent) {
    evento.preventDefault();
    setFase("enviando");
    setMensagem("");
    setLog(null);
    gravar(CHAVE_SENHA, senha);
    try {
      const resposta = await fetch("/api/adaptar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ senha, texto, fonteUrl, fonteNome }),
      });
      const json = await resposta.json();
      if (!json.ok) {
        setFase("erro");
        setMensagem(json.erro ?? "Algo deu errado.");
        return;
      }
      const p = { id: json.id as string, desde: Date.now() };
      gravar(CHAVE_PENDENTE, JSON.stringify(p));
      setFase("fila");
      setPendente(p);
    } catch {
      setFase("erro");
      setMensagem("Falha de rede ao enviar. Tente de novo.");
    }
  }

  function recomecar() {
    if (timer.current) clearTimeout(timer.current);
    gravar(CHAVE_PENDENTE, null);
    setPendente(null);
    setFase("ocioso");
    setMensagem("");
    setLog(null);
  }

  const acompanhando = pendente && fase !== "ocioso" && fase !== "enviando";
  const indiceAtual = ETAPAS.findIndex((e) => e.fase === fase);
  const campo =
    "w-full rounded-md border border-borda bg-superficie px-3 py-2 text-texto outline-none placeholder:text-suave/70 focus:border-destaque";

  if (acompanhando) {
    return (
      <section className="space-y-5 rounded-lg border border-borda bg-superficie/60 p-5">
        <ol className="space-y-3">
          {ETAPAS.map((etapa, i) => {
            const feita = fase !== "erro" && i < indiceAtual;
            const atual = fase !== "erro" && i === indiceAtual;
            return (
              <li key={etapa.fase} className="flex items-center gap-3 text-sm">
                <span
                  aria-hidden="true"
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs ${
                    feita
                      ? "border-destaque bg-destaque text-white"
                      : atual
                        ? "animate-pulse border-destaque text-destaque"
                        : "border-borda text-suave"
                  }`}
                >
                  {feita ? "✓" : i + 1}
                </span>
                <span className={feita || atual ? "text-texto" : "text-suave"}>{etapa.rotulo}</span>
              </li>
            );
          })}
        </ol>

        {fase === "pronto" && pendente && (
          <Link
            href={`/manual/${pendente.id}`}
            className="inline-block rounded-md bg-destaque px-4 py-2 font-medium text-white hover:bg-destaque/90"
          >
            Abrir artigo para copiar →
          </Link>
        )}

        {fase === "erro" && <p className="text-sm text-rumor">{mensagem}</p>}
        {fase !== "erro" && mensagem && <p className="text-xs text-suave">{mensagem}</p>}

        <div className="flex flex-wrap items-center gap-4 text-xs text-suave">
          {log && (
            <a href={log} target="_blank" rel="noopener noreferrer" className="hover:text-texto">
              ver execução no GitHub
            </a>
          )}
          <button type="button" onClick={recomecar} className="hover:text-texto">
            {fase === "pronto" || fase === "erro" ? "adaptar outra notícia" : "parar de acompanhar"}
          </button>
        </div>
      </section>
    );
  }

  return (
    <form onSubmit={enviar} className="space-y-5">
      <div className="space-y-2">
        <label htmlFor="texto" className="block text-sm font-medium">
          Notícia original
        </label>
        <textarea
          id="texto"
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          rows={14}
          placeholder="Cole aqui a matéria inteira, do título ao último parágrafo. Pode ser em inglês."
          className={`${campo} font-mono text-sm leading-relaxed`}
        />
        <p className="text-xs text-suave">
          {texto.trim().length.toLocaleString("pt-BR")} caracteres. Cole o texto completo: o redator só
          usa o que estiver aqui, então resumo vira artigo raso.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label htmlFor="fonteUrl" className="block text-sm font-medium">
            Link da matéria <span className="font-normal text-suave">(recomendado)</span>
          </label>
          <input
            id="fonteUrl"
            type="url"
            value={fonteUrl}
            onChange={(e) => setFonteUrl(e.target.value)}
            placeholder="https://..."
            className={campo}
          />
          <p className="text-xs text-suave">Vira o link da fonte e ajuda a achar imagem e trailer.</p>
        </div>
        <div className="space-y-2">
          <label htmlFor="fonteNome" className="block text-sm font-medium">
            Nome da fonte
          </label>
          <input
            id="fonteNome"
            type="text"
            value={fonteNome}
            onChange={(e) => setFonteNome(e.target.value)}
            placeholder="ex.: IGN Brasil"
            maxLength={80}
            className={campo}
          />
        </div>
      </div>

      <div className="space-y-2 sm:max-w-xs">
        <label htmlFor="senha" className="block text-sm font-medium">
          Senha do painel
        </label>
        <input
          id="senha"
          type="password"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          autoComplete="current-password"
          className={campo}
        />
      </div>

      {fase === "erro" && <p className="text-sm text-rumor">{mensagem}</p>}

      <button
        type="submit"
        disabled={fase === "enviando" || !senha || (!texto.trim() && !fonteUrl.trim())}
        className="rounded-md bg-destaque px-5 py-2.5 font-medium text-white hover:bg-destaque/90 disabled:opacity-50"
      >
        {fase === "enviando" ? "Enviando..." : "Adaptar para o blog"}
      </button>
    </form>
  );
}
