"use client";

import { useState } from "react";

export default function PainelRadar() {
  const [senha, setSenha] = useState("");
  const [data, setData] = useState("");
  const [estado, setEstado] = useState<"ocioso" | "enviando" | "sucesso" | "erro">("ocioso");
  const [mensagem, setMensagem] = useState("");

  async function rodar() {
    setEstado("enviando");
    setMensagem("");
    try {
      const resposta = await fetch("/api/rodar-radar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ senha, data }),
      });
      const json = await resposta.json();
      if (json.ok) {
        setEstado("sucesso");
        setMensagem(
          "Disparado! Leva alguns minutos rodando os agentes, e o site republica sozinho no final."
        );
      } else {
        setEstado("erro");
        setMensagem(json.erro || "Algo deu errado.");
      }
    } catch {
      setEstado("erro");
      setMensagem("Falha de rede ao tentar disparar.");
    }
  }

  return (
    <div className="mx-auto max-w-md">
      <h1 className="mb-6 text-xl font-semibold tracking-tight">Rodar o Radar Games</h1>

      <label className="mb-2 block text-sm text-suave">Senha</label>
      <input
        type="password"
        value={senha}
        onChange={(e) => setSenha(e.target.value)}
        autoComplete="off"
        className="mb-4 w-full rounded-md border border-borda bg-superficie px-3 py-2 text-texto outline-none focus:border-destaque"
      />

      <label className="mb-2 block text-sm text-suave">Data (opcional, AAAA-MM-DD)</label>
      <input
        type="text"
        value={data}
        onChange={(e) => setData(e.target.value)}
        placeholder="deixe em branco para hoje"
        className="mb-6 w-full rounded-md border border-borda bg-superficie px-3 py-2 text-texto outline-none placeholder:text-suave focus:border-destaque"
      />

      <button
        onClick={rodar}
        disabled={estado === "enviando" || !senha}
        className="w-full rounded-md bg-destaque px-4 py-2 font-medium text-white disabled:opacity-50"
      >
        {estado === "enviando" ? "Disparando..." : "Rodar radar de hoje"}
      </button>

      {mensagem && (
        <p className={`mt-4 text-sm ${estado === "sucesso" ? "text-texto" : "text-rumor"}`}>
          {mensagem}
        </p>
      )}
    </div>
  );
}
