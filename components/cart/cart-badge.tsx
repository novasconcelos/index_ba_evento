"use client";

import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import { useCart } from "@/components/cart/cart-context";

export function CartBadge() {
  const { items } = useCart();
  return (
    <Link
      href="/checkout"
      className="relative flex items-center gap-1 rounded-md bg-brand-navy-light px-3 py-1.5 hover:bg-brand-teal-dark"
    >
      <ShoppingCart className="h-4 w-4" />
      <span className="hidden sm:inline">Meus stands</span>
      {items.length > 0 && (
        <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-lime px-1 text-xs font-bold text-brand-navy">
          {items.length}
        </span>
      )}
    </Link>
  );
}
