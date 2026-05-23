import { redirect } from "next/navigation";
import { auth } from "@/auth";

// Protege páginas do admin. Use no topo de cada page server-side do /admin
// (exceto a página de login).
export async function requireAdmin() {
  const session = await auth();
  if (!session?.user) redirect("/admin/login");
  return session;
}
