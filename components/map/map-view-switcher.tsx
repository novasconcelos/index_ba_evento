import Link from "next/link";

// Alterna entre as duas visões do mapa (/mapa isométrico ↔ /mapa2 planta 2D).
// O carrinho é client-side e compartilhado, então a seleção persiste ao trocar.
export function MapViewSwitcher({ active }: { active: "iso" | "flat" }) {
  const base = "rounded-full border px-3 py-1 text-xs font-medium transition-colors";
  const on = "border-brand-navy bg-brand-navy text-white";
  const off = "border-gray-300 bg-white text-gray-600 hover:bg-gray-50";
  return (
    <div className="flex items-center gap-1.5">
      <Link href="/mapa" className={`${base} ${active === "iso" ? on : off}`}>
        Isométrico 3D
      </Link>
      <Link href="/mapa2" className={`${base} ${active === "flat" ? on : off}`}>
        Planta 2D
      </Link>
    </div>
  );
}
