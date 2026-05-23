"use client";

import Link from "next/link";
import { X } from "lucide-react";
import { useCart } from "@/components/cart/cart-context";
import { formatBRL } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export function CartSummary({ showCheckout = true }: { showCheckout?: boolean }) {
  const { items, totalCents, remove } = useCart();

  return (
    <div className="sticky top-20 rounded-xl border border-gray-200 bg-white">
      <div className="border-b border-gray-100 p-4">
        <h2 className="font-semibold text-gray-900">Stands selecionados</h2>
        <p className="text-sm text-gray-500">{items.length} stand(s)</p>
      </div>

      {items.length === 0 ? (
        <p className="p-4 text-sm text-gray-500">
          Clique nos stands disponíveis no mapa para montar sua reserva.
        </p>
      ) : (
        <ul className="divide-y divide-gray-100">
          {items.map((item) => (
            <li key={item.id} className="flex items-center justify-between p-3">
              <div>
                <p className="font-medium text-gray-900">Stand {item.code}</p>
                <p className="text-xs text-gray-500">
                  {item.segment}
                  {item.sizeM2 ? ` • ${item.sizeM2} m²` : ""}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-brand-navy">
                  {formatBRL(item.priceCents)}
                </span>
                <button
                  onClick={() => remove(item.id)}
                  className="text-gray-400 hover:text-red-500"
                  aria-label="Remover"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <div className="border-t border-gray-100 p-4">
        <div className="flex items-center justify-between">
          <span className="text-gray-600">Total</span>
          <span className="text-lg font-bold text-brand-navy">
            {formatBRL(totalCents)}
          </span>
        </div>
        {showCheckout && (
          <Link href="/checkout" className="mt-3 block">
            <Button className="w-full" disabled={items.length === 0}>
              Continuar para cadastro
            </Button>
          </Link>
        )}
      </div>
    </div>
  );
}
