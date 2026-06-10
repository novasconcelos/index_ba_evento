import Link from "next/link";
import { auth } from "@/auth";
import { CartProvider } from "@/components/cart/cart-context";
import { CartBadge } from "@/components/cart/cart-badge";
import { IndexWordmark } from "@/components/brand/index-logo";

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  const isExhibitor = session?.user?.kind === "exhibitor";

  return (
    <CartProvider>
      <header className="sticky top-0 z-30 bg-brand-navy text-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <Link href="/">
            <IndexWordmark />
          </Link>
          <nav className="flex items-center gap-5 text-sm font-medium">
            <Link href="/mapa" className="hidden hover:text-brand-lime sm:inline">
              Mapa
            </Link>
            <Link
              href={isExhibitor ? "/painel" : "/entrar"}
              className="hover:text-brand-lime"
            >
              {isExhibitor ? "Minha conta" : "Entrar"}
            </Link>
            <CartBadge />
            <Link
              href="/mapa"
              className="rounded-full bg-brand-lime px-4 py-2 font-semibold text-brand-navy hover:bg-brand-lime-dark"
            >
              Reservar stand
            </Link>
          </nav>
        </div>
      </header>
      <main className="w-full flex-1 px-4 py-6 lg:px-6">{children}</main>
      <footer className="border-t border-gray-200 bg-white py-6 text-center text-xs text-gray-500">
        INDEX — O maior evento da indústria do Nordeste · Realização Sistema FIEB
        e SEBRAE
      </footer>
    </CartProvider>
  );
}
