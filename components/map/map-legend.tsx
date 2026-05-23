const ITEMS: { label: string; fill: string; stroke: string }[] = [
  { label: "Disponível", fill: "#bbf7d0", stroke: "#16a34a" },
  { label: "Selecionado", fill: "#29b6c9", stroke: "#1b1568" },
  { label: "Reservado", fill: "#fde68a", stroke: "#f59e0b" },
  { label: "Vendido", fill: "#e9d5ff", stroke: "#9333ea" },
  { label: "Patrocínio", fill: "#bae6fd", stroke: "#0ea5e9" },
  { label: "Bloqueado", fill: "#e5e7eb", stroke: "#9ca3af" },
];

export function MapLegend() {
  return (
    <div className="flex flex-wrap gap-3 rounded-lg border border-gray-200 bg-white p-3 text-xs">
      {ITEMS.map((i) => (
        <span key={i.label} className="flex items-center gap-1.5">
          <span
            className="inline-block h-3.5 w-3.5 rounded"
            style={{ backgroundColor: i.fill, border: `1.5px solid ${i.stroke}` }}
          />
          {i.label}
        </span>
      ))}
    </div>
  );
}
