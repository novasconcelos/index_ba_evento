import { redirect } from "next/navigation";
import { auth } from "@/auth";

// Protege páginas do admin. Use no topo de cada page server-side do /admin
// (exceto a página de login).
export async function requireAdmin() {
  const session = await auth();
  if (session?.user?.kind !== "admin") redirect("/admin/login");
  return session;
}

// Protege o portal do expositor (/painel). Redireciona para /entrar quando não
// há sessão de expositor (inclusive se for uma sessão de admin).
export async function requireExhibitor() {
  const session = await auth();
  if (session?.user?.kind !== "exhibitor") redirect("/entrar");
  return session;
}
