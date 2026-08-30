import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Radar Games — o TOP 10 do dia em games e esports",
  description:
    "Radar diário de games e esports: empresas, lançamentos, vazamentos e esports, com fonte em todo item.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="min-h-screen bg-fundo text-texto antialiased">
        <header className="border-b border-borda">
          <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-5">
            <Link href="/" className="text-lg font-semibold tracking-tight">
              <span aria-hidden="true">📡</span> Radar Games
            </Link>
            <Link href="/metodologia" className="text-sm text-suave hover:text-texto">
              Metodologia
            </Link>
          </div>
        </header>
        <main className="mx-auto max-w-4xl px-4 py-8">{children}</main>
        <footer className="border-t border-borda">
          <div className="mx-auto max-w-4xl px-4 py-6 text-sm text-suave">
            Curadoria automatizada com fonte verificável em todo item.
          </div>
        </footer>
      </body>
    </html>
  );
}
