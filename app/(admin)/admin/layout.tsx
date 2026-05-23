import Link from "next/link";
import {
  LayoutDashboard,
  Grid3x3,
  Map as MapIcon,
  ShoppingBag,
  Building2,
  Target,
  Mail,
  LogOut,
} from "lucide-react";
import { auth, signOut } from "@/auth";
import { IndexLogo } from "@/components/brand/index-logo";

const NAV = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/pedidos", label: "Pedidos", icon: ShoppingBag },
  { href: "/admin/stands", label: "Stands", icon: Grid3x3 },
  { href: "/admin/mapa", label: "Editor do mapa", icon: MapIcon },
  { href: "/admin/expositores", label: "Expositores", icon: Building2 },
  { href: "/admin/metas", label: "Metas", icon: Target },
  { href: "/admin/convites", label: "Convites", icon: Mail },
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  // Página de login (sem sessão) é renderizada sem o chrome do admin.
  if (!session?.user) {
    return <div className="flex min-h-screen flex-1">{children}</div>;
  }

  return (
    <div className="flex min-h-screen flex-1">
      <aside className="flex w-60 flex-col bg-brand-navy text-white">
        <div className="flex items-center gap-2 border-b border-white/10 p-4 font-bold">
          <IndexLogo className="h-6 w-6" primary="#ffffff" accent="#c6e84d" />
          <span>INDEX Admin</span>
        </div>
        <nav className="flex-1 space-y-1 p-3 text-sm">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-2 rounded-lg px-3 py-2 hover:bg-white/10"
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          ))}
        </nav>
        <form
          action={async () => {
            "use server";
            await signOut({ redirectTo: "/admin/login" });
          }}
          className="border-t border-white/10 p-3"
        >
          <button className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-white/10">
            <LogOut className="h-4 w-4" />
            Sair ({session.user.name})
          </button>
        </form>
      </aside>
      <div className="flex-1 overflow-auto bg-background p-6">{children}</div>
    </div>
  );
}
