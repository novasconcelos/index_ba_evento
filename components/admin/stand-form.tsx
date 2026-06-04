import Link from "next/link";
import { Input, Label, Select } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { STAND_STATUSES } from "@/lib/enums";
import { standStatusLabel } from "@/lib/labels";
import { formatBRL } from "@/lib/utils";

interface StandLike {
  id: string;
  code: string;
  tipo: string | null;
  sector: string | null;
  sizeM2: number | null;
  priceCents: number;
  status: string;
  svgShapeId: string | null;
  positionLabel: string | null;
}

// Renderiza um <option> "vazio" + a opção atual mesmo que não esteja na lista,
// garantindo que valores antigos não desapareçam silenciosamente.
function optionList(options: string[], current: string | null): string[] {
  const set = new Set(options);
  if (current && !set.has(current)) return [current, ...options];
  return options;
}

export function StandForm({
  action,
  stand,
  tipos = [],
  asas = [],
  localizacoes = [],
}: {
  action: (formData: FormData) => void;
  stand?: StandLike;
  tipos?: string[];
  asas?: string[];
  localizacoes?: string[];
}) {
  return (
    <form action={action} className="max-w-xl space-y-4">
      {stand && <input type="hidden" name="id" value={stand.id} />}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="code">Código *</Label>
          <Input id="code" name="code" required defaultValue={stand?.code} />
        </div>
        <div>
          <Label htmlFor="svgShapeId">ID da forma no SVG</Label>
          <Input
            id="svgShapeId"
            name="svgShapeId"
            defaultValue={stand?.svgShapeId ?? ""}
            placeholder="ex.: H1"
          />
        </div>
        <div>
          <Label htmlFor="tipo">Tipo (Stand ou Piso)</Label>
          <Select id="tipo" name="tipo" defaultValue={stand?.tipo ?? ""}>
            <option value="">—</option>
            {optionList(tipos, stand?.tipo ?? null).map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="sector">ASA</Label>
          <Select id="sector" name="sector" defaultValue={stand?.sector ?? ""}>
            <option value="">—</option>
            {optionList(asas, stand?.sector ?? null).map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="positionLabel">Localização</Label>
          <Select
            id="positionLabel"
            name="positionLabel"
            defaultValue={stand?.positionLabel ?? ""}
          >
            <option value="">—</option>
            {optionList(localizacoes, stand?.positionLabel ?? null).map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="sizeM2">Metragem (m²)</Label>
          <Input
            id="sizeM2"
            name="sizeM2"
            type="number"
            defaultValue={stand?.sizeM2 ?? ""}
          />
        </div>
        <div>
          <Label htmlFor="price">Valor (R$)</Label>
          <Input
            id="price"
            name="price"
            defaultValue={stand ? formatBRL(stand.priceCents) : ""}
            placeholder="R$ 0,00"
          />
        </div>
        <div>
          <Label htmlFor="status">Status</Label>
          <Select
            id="status"
            name="status"
            defaultValue={stand?.status ?? "AVAILABLE"}
          >
            {STAND_STATUSES.map((s) => (
              <option key={s} value={s}>
                {standStatusLabel[s]}
              </option>
            ))}
          </Select>
        </div>
      </div>
      <div className="flex gap-3">
        <Button type="submit">Salvar</Button>
        <Link href="/admin/stands">
          <Button type="button" variant="outline">
            Cancelar
          </Button>
        </Link>
      </div>
    </form>
  );
}
