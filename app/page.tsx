import { redirect } from "next/navigation";
import { CATEGORIA_PADRAO } from "@/config/categorias";

export default function Home() {
  redirect(`/${CATEGORIA_PADRAO}`);
}
