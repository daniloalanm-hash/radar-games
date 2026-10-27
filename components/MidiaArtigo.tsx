export function MidiaArtigo({
  imagem,
  imagemCredito,
  imagemOrigem,
  video,
}: {
  imagem: string | null;
  imagemCredito: string | null;
  imagemOrigem: "oficial" | "veiculo" | null;
  video: string | null;
}) {
  if (!imagem && !video) return null;

  return (
    <div className="space-y-4">
      {imagem && (
        <figure className="space-y-2">
          {/* eslint-disable-next-line @next/next/no-img-element -- imagem externa, sem otimização */}
          <img src={imagem} alt="" loading="lazy" className="w-full rounded-lg border border-borda" />
          <figcaption className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-suave">
            {imagemCredito && <span>Imagem: {imagemCredito}</span>}
            {imagemOrigem === "veiculo" && (
              <span className="text-alerta">
                imagem do veículo, confira os direitos antes de publicar
              </span>
            )}
            <a
              href={imagem}
              target="_blank"
              rel="noopener noreferrer"
              className="text-destaque hover:underline"
            >
              abrir em tamanho original
            </a>
          </figcaption>
        </figure>
      )}

      {video && (
        <p className="text-sm">
          Trailer para inserir no blog:{" "}
          <a
            href={video}
            target="_blank"
            rel="noopener noreferrer"
            className="break-all text-destaque hover:underline"
          >
            {video}
          </a>
        </p>
      )}
    </div>
  );
}
