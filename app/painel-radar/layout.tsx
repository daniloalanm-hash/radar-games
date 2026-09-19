import type { Metadata } from "next";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
  title: "Painel",
};

export default function PainelRadarLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
